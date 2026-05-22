import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bandes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/auth";

function getFarmId(req: NextRequest): string | null {
  return req.headers.get("x-farm-id");
}

export async function GET(req: NextRequest) {
  try {
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const all = await getDb().select().from(bandes).where(eq(bandes.farm_id, farmId));
    return NextResponse.json(all);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("GET /api/bandes", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const data = await req.json();
    const newBande = {
      id: generateId(),
      farm_id: farmId,
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
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("POST /api/bandes", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
