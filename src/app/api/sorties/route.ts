import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sorties } from "@/lib/schema";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    const all = await getDb().select().from(sorties);
    return NextResponse.json(all);
  } catch (error) {
    console.error("GET /api/sorties", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newEntry = {
      id: generateId(),
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
