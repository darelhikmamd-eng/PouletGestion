import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, setSessionCookie, generateId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      nom_ferme,
      localite = "",
      ville = "",
      pays = "",
      contact = "",
      activite_principale = "",
      objectif_utilisateur = "",
    } = body;

    if (!email || !password || !nom_ferme) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom de la ferme sont obligatoires." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check email uniqueness
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      );
    }

    const id = generateId();
    const password_hash = await hashPassword(password);

    const newUser = {
      id,
      email: email.toLowerCase().trim(),
      password_hash,
      nom_ferme,
      localite,
      ville,
      pays,
      contact,
      activite_principale,
      objectif_utilisateur,
    };

    await db.insert(users).values(newUser);

    // Create session
    await setSessionCookie({
      userId: id,
      farmId: id,
      email: newUser.email,
      nomFerme: nom_ferme,
    });

    return NextResponse.json(
      {
        id,
        email: newUser.email,
        nom_ferme,
        localite,
        ville,
        pays,
        contact,
        activite_principale,
        objectif_utilisateur,
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("POST /api/auth/register", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
