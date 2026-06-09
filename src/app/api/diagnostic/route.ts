import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_MODEL = "gemini-2.0-flash";

const SYSTEM_PROMPT = `Tu es un assistant vétérinaire avicole expert, spécialisé dans l'élevage de poulets de chair (souche Cobb 500).
On te fournit une PHOTO prise sur le terrain par un éleveur : il peut s'agir de fientes/déjections, de la litière, d'un sujet (poulet) ou d'un groupe de sujets.

Ta mission : analyser visuellement l'image et fournir un diagnostic présomptif de pathologie aviaire, en français.

Règles importantes :
- Base-toi UNIQUEMENT sur ce qui est réellement visible sur l'image (couleur/aspect des fientes, posture, plumage, état de la litière, lésions visibles...).
- Identifie la pathologie la plus probable. Privilégie l'une de ces catégories quand elle correspond :
  - "coccidiose" : fientes diarrhéiques rosâtres à rouges (sang), sujets prostrés.
  - "newcastle" : diarrhée verdâtre aqueuse, signes respiratoires/nerveux.
  - "colibacillose" : fientes blanchâtres à jaunâtres pâteuses, détresse respiratoire légère.
  - "sain" : aspect normal, fientes bien formées brun-grisâtre avec coiffe d'urates blanche, sujets alertes.
  Si une autre affection est plus probable, utilise id="autre" et donne son nom réel.
- Si l'image n'est pas exploitable ou ne montre pas de volaille/fientes/litière, mets id="indetermine", statut="indetermine", confiance basse (<40), et explique pourquoi dans la description.
- "confiance" est un nombre 0 à 100 reflétant honnêtement ta certitude visuelle (ne surestime pas).
- "statut" : "sain" si aucune pathologie, "alerte" si pathologie détectée, "indetermine" si image non exploitable.
- "dureeConvalescenceJours" : durée estimée de convalescence (0 si sain/indéterminé).
- Donne des "symptomes" (ce qui est visible + attendu), des "mesuresUrgence" concrètes, et un "traitementPropose" réaliste pour l'aviculture.
- Réponds STRICTEMENT au format JSON demandé, sans texte additionnel.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    id: { type: "STRING" },
    nom: { type: "STRING" },
    statut: { type: "STRING" },
    confiance: { type: "NUMBER" },
    description: { type: "STRING" },
    symptomes: { type: "ARRAY", items: { type: "STRING" } },
    mesuresUrgence: { type: "ARRAY", items: { type: "STRING" } },
    traitementPropose: { type: "STRING" },
    dureeConvalescenceJours: { type: "INTEGER" },
  },
  required: [
    "id",
    "nom",
    "statut",
    "confiance",
    "description",
    "symptomes",
    "mesuresUrgence",
    "traitementPropose",
    "dureeConvalescenceJours",
  ],
};

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Gemini absente. Ajoutez GEMINI_API_KEY dans le fichier .env.local du serveur." },
        { status: 500 }
      );
    }

    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image manquante." }, { status: 400 });
    }

    const parsed = parseDataUrl(image);
    if (!parsed) {
      return NextResponse.json({ error: "Format d'image invalide (data URL base64 attendu)." }, { status: 400 });
    }
    if (!parsed.mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier fourni n'est pas une image." }, { status: 400 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: SYSTEM_PROMPT },
              { inline_data: { mime_type: parsed.mimeType, data: parsed.base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("Gemini API error", geminiRes.status, errText);

      let detail: { error?: { status?: string; message?: string; details?: { "@type"?: string; retryDelay?: string }[] } } | null = null;
      try { detail = JSON.parse(errText); } catch { /* corps non JSON */ }
      const gStatus = detail?.error?.status;
      const gMessage = detail?.error?.message;

      if (geminiRes.status === 429 || gStatus === "RESOURCE_EXHAUSTED") {
        const retry = detail?.error?.details?.find((d) => d["@type"]?.includes("RetryInfo"))?.retryDelay;
        return NextResponse.json(
          { error: `Quota Gemini dépassé (offre gratuite). ${retry ? `Réessayez dans ${retry}` : "Réessayez plus tard"}, ou activez la facturation sur Google AI Studio.` },
          { status: 429 }
        );
      }
      if (geminiRes.status === 403 || gStatus === "PERMISSION_DENIED") {
        return NextResponse.json(
          { error: "Clé API Gemini refusée (403). Vérifiez que la clé est valide et autorisée pour l'API Generative Language." },
          { status: 403 }
        );
      }
      if (geminiRes.status === 400) {
        return NextResponse.json(
          { error: gMessage ? `Requête refusée par Gemini : ${gMessage}` : "Image ou requête invalide pour l'analyse." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Erreur du service d'analyse Gemini (${geminiRes.status}). Réessayez plus tard.` },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();

    const candidate = data?.candidates?.[0];
    const textPart = candidate?.content?.parts?.find((p: { text?: string }) => typeof p.text === "string")?.text;

    if (!textPart) {
      const blockReason = data?.promptFeedback?.blockReason;
      return NextResponse.json(
        { error: blockReason ? `Analyse bloquée (${blockReason}).` : "Le modèle n'a renvoyé aucun résultat exploitable." },
        { status: 502 }
      );
    }

    let result;
    try {
      result = JSON.parse(textPart);
    } catch {
      return NextResponse.json({ error: "Réponse du modèle illisible." }, { status: 502 });
    }

    // Normalisation défensive
    const normalized = {
      id: String(result.id ?? "autre"),
      nom: String(result.nom ?? "Diagnostic indéterminé"),
      statut: ["sain", "alerte", "indetermine"].includes(result.statut) ? result.statut : "alerte",
      confiance: Math.max(0, Math.min(100, Number(result.confiance) || 0)),
      description: String(result.description ?? ""),
      symptomes: Array.isArray(result.symptomes) ? result.symptomes.map(String) : [],
      mesuresUrgence: Array.isArray(result.mesuresUrgence) ? result.mesuresUrgence.map(String) : [],
      traitementPropose: String(result.traitementPropose ?? ""),
      dureeConvalescenceJours: Math.max(0, Math.round(Number(result.dureeConvalescenceJours) || 0)),
    };

    return NextResponse.json(normalized);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("POST /api/diagnostic", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
