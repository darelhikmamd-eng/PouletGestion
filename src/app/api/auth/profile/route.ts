import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const {
      nom_ferme,
      localite,
      ville,
      pays,
      contact,
      activite_principale,
      objectif_utilisateur,
    } = body;

    const requiredFields: Record<string, unknown> = {
      "Le nom de la ferme": nom_ferme,
      "La localité": localite,
      "La ville": ville,
      "Le pays": pays,
      "Le contact": contact,
    };
    for (const [label, value] of Object.entries(requiredFields)) {
      if (!value || !String(value).trim()) {
        return NextResponse.json(
          { error: `${label} est obligatoire.` },
          { status: 400 }
        );
      }
    }

    const db = getDb();

    await db
      .update(users)
      .set({
        nom_ferme: String(nom_ferme).trim(),
        localite: localite ?? "",
        ville: ville ?? "",
        pays: pays ?? "",
        contact: contact ?? "",
        activite_principale: activite_principale ?? "",
        objectif_utilisateur: objectif_utilisateur ?? "",
      })
      .where(eq(users.id, session.userId));

    const [updated] = await db
      .select({
        id: users.id,
        email: users.email,
        nom_ferme: users.nom_ferme,
        localite: users.localite,
        ville: users.ville,
        pays: users.pays,
        contact: users.contact,
        activite_principale: users.activite_principale,
        objectif_utilisateur: users.objectif_utilisateur,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!updated) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("PATCH /api/auth/profile", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
