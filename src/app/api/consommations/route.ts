import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consommations } from "@/lib/schema";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    const all = await db.select().from(consommations);
    return NextResponse.json(all);
  } catch (error) {
    console.error("GET /api/consommations", error);
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
      type_aliment: data.type_aliment,
      conditionnement: data.conditionnement,
      quantite_kg: data.quantite_kg,
      montant: data.montant,
    };
    await db.insert(consommations).values(newEntry);
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("POST /api/consommations", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
