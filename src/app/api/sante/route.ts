import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sante } from "@/lib/schema";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    const all = await db.select().from(sante);
    return NextResponse.json(all);
  } catch (error) {
    console.error("GET /api/sante", error);
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
      type_op: data.type_op,
      medicament: data.medicament,
      maladie_cible: data.maladie_cible ?? "",
      montant: data.montant,
    };
    await db.insert(sante).values(newEntry);
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("POST /api/sante", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
