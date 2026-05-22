import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromRequest } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Read session from the request cookie (consistent with middleware)
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const db = getDb();
    const results = await db
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

    const user = results[0];
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("GET /api/auth/me", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
