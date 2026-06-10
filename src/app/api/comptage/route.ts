import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_MODEL = "gemini-2.0-flash";

const DETECTION_PROMPT = `Tu es un système de vision par ordinateur spécialisé dans le comptage d'animaux d'élevage.
On te fournit une PHOTO d'un poulailler / d'un lot de poulets de chair.

Ta mission : DÉTECTER CHAQUE POULET (volaille) visible dans l'image, même partiellement visible ou regroupé avec d'autres.

Règles :
- Renvoie UNE boîte englobante par poulet individuel détecté.
- Le format de chaque boîte est "box_2d": [ymin, xmin, ymax, xmax], avec des coordonnées entières normalisées entre 0 et 1000 (0 = haut/gauche, 1000 = bas/droite) par rapport aux dimensions de l'image.
- N'invente pas de poulets : ne compte que ceux réellement visibles.
- Ignore les objets qui ne sont pas des volailles (mangeoires, abreuvoirs, humains, matériel).
- Si l'image ne contient aucun poulet, renvoie une liste vide.
- Sois exhaustif : dans une foule dense, essaie d'individualiser chaque sujet.
- Réponds STRICTEMENT au format JSON demandé, sans texte additionnel.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    objets: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          box_2d: { type: "ARRAY", items: { type: "INTEGER" } },
          label: { type: "STRING" },
        },
        required: ["box_2d"],
      },
    },
  },
  required: ["objets"],
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
        { error: "Clé API Gemini absente. Ajoutez GEMINI_API_KEY dans les variables d'environnement du serveur." },
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
              { text: DETECTION_PROMPT },
              { inline_data: { mime_type: parsed.mimeType, data: parsed.base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("Gemini API error (comptage)", geminiRes.status, errText);

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
          { error: "Clé API Gemini refusée (403). Vérifiez la clé et ses autorisations." },
          { status: 403 }
        );
      }
      if (geminiRes.status === 400) {
        return NextResponse.json(
          { error: gMessage ? `Requête refusée par Gemini : ${gMessage}` : "Image invalide pour l'analyse." },
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

    let result: { objets?: { box_2d?: number[]; label?: string }[] };
    try {
      result = JSON.parse(textPart);
    } catch {
      return NextResponse.json({ error: "Réponse du modèle illisible." }, { status: 502 });
    }

    const rawObjets = Array.isArray(result.objets) ? result.objets : [];

    // Normalisation : conversion box_2d [ymin,xmin,ymax,xmax] (0-1000) en centre + dimensions en pourcentage
    const detections = rawObjets
      .filter((o) => Array.isArray(o.box_2d) && o.box_2d.length === 4)
      .map((o) => {
        const [ymin, xmin, ymax, xmax] = o.box_2d as number[];
        const clamp = (v: number) => Math.max(0, Math.min(1000, v));
        const top = clamp(ymin) / 10;
        const left = clamp(xmin) / 10;
        const bottom = clamp(ymax) / 10;
        const right = clamp(xmax) / 10;
        return {
          cx: (left + right) / 2,
          cy: (top + bottom) / 2,
          w: Math.max(0, right - left),
          h: Math.max(0, bottom - top),
        };
      });

    return NextResponse.json({ total: detections.length, detections });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("POST /api/comptage", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
