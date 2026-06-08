import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureTablesExist } from "@/lib/db";
import { documents } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/auth";

function getFarmId(req: NextRequest): string | null {
  return req.headers.get("x-farm-id");
}

// Limite de taille du data URL (base64) ~ 4 Mo
const MAX_DATA_URL_LENGTH = 4 * 1024 * 1024;

export async function GET(req: NextRequest) {
  try {
    await ensureTablesExist();
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const all = await getDb()
      .select()
      .from(documents)
      .where(eq(documents.farm_id, farmId))
      .orderBy(desc(documents.created_at));

    return NextResponse.json(all);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("GET /api/documents", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const data = await req.json();
    const { bande_id, nom, type, date, data_url, taille } = data;

    if (!bande_id || !nom || !type || !date || !data_url) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (bande, nom, type, date, fichier)." },
        { status: 400 }
      );
    }

    if (typeof data_url !== "string" || data_url.length > MAX_DATA_URL_LENGTH) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum ~3 Mo après compression." },
        { status: 413 }
      );
    }

    const newDoc = {
      id: generateId(),
      farm_id: farmId,
      bande_id,
      nom,
      type,
      date,
      data_url,
      taille: typeof taille === "number" ? taille : 0,
    };

    await getDb().insert(documents).values(newDoc);
    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("POST /api/documents", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
