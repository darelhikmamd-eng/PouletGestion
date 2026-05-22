import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sorties } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/auth";

function getFarmId(req: NextRequest): string | null {
  return req.headers.get("x-farm-id");
}

export async function GET(req: NextRequest) {
  try {
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const all = await getDb().select().from(sorties).where(eq(sorties.farm_id, farmId));
    return NextResponse.json(all);
  } catch (error) {
    console.error("GET /api/sorties", error);
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
      motif: data.motif,
      cause_deces: data.cause_deces ?? "",
      quantite: data.quantite,
      prix_unitaire: data.prix_unitaire ?? 0,
      montant_total: data.montant_total ?? 0,
    };
    await getDb().insert(sorties).values(newEntry);
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("POST /api/sorties", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
