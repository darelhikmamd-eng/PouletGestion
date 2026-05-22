import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sante } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/auth";

function getFarmId(req: NextRequest): string | null {
  return req.headers.get("x-farm-id");
}

export async function GET(req: NextRequest) {
  try {
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const all = await getDb().select().from(sante).where(eq(sante.farm_id, farmId));
    return NextResponse.json(all);
  } catch (error) {
    console.error("GET /api/sante", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const data = await req.json();
    const newEntry = {
      id: generateId(),
      farm_id: farmId,
      bande_id: data.bande_id,
      date: data.date,
      type_op: data.type_op,
      medicament: data.medicament,
      maladie_cible: data.maladie_cible ?? "",
      montant: data.montant,
    };
    await getDb().insert(sante).values(newEntry);
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("POST /api/sante", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
