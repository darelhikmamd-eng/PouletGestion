import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bandes } from "@/lib/schema";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    const all = await getDb().select().from(bandes);
    return NextResponse.json(all);
  } catch (error) {
    console.error("GET /api/bandes", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newBande = {
      id: generateId(),
      nom_lot: data.nom_lot,
      date_debut: data.date_debut,
      objectif: data.objectif,
      nbr_poussins: data.nbr_poussins,
      prix_achat_global: data.prix_achat_global,
      race: data.race,
      fournisseur: data.fournisseur,
      contact_fournisseur: data.contact_fournisseur ?? "",
      statut: "actif",
    };
    await getDb().insert(bandes).values(newBande);
    return NextResponse.json(newBande, { status: 201 });
  } catch (error) {
    console.error("POST /api/bandes", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
