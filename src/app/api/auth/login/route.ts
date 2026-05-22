import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureTablesExist } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Auto-create tables if they don't exist yet
    await ensureTablesExist();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe sont obligatoires." },
        { status: 400 }
      );
    }

    const db = getDb();

    const results = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    const user = results[0];

    if (!user) {
      return NextResponse.json(
        { error: "Identifiants incorrects. Vérifiez votre email et mot de passe." },
        { status: 401 }
      );
    }

    const passwordOk = await verifyPassword(password, user.password_hash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Identifiants incorrects. Vérifiez votre email et mot de passe." },
        { status: 401 }
      );
    }

    // Create JWT session cookie
    await setSessionCookie({
      userId: user.id,
      farmId: user.id,
      email: user.email,
      nomFerme: user.nom_ferme,
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nom_ferme: user.nom_ferme,
      localite: user.localite,
      ville: user.ville,
      pays: user.pays,
      contact: user.contact,
      activite_principale: user.activite_principale,
      objectif_utilisateur: user.objectif_utilisateur,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("POST /api/auth/login", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
