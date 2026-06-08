import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromRequest, verifyPassword, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Mot de passe actuel et nouveau mot de passe requis." },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [user] = await db
      .select({ id: users.id, password_hash: users.password_hash })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const ok = await verifyPassword(currentPassword, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Le mot de passe actuel est incorrect." },
        { status: 401 }
      );
    }

    const password_hash = await hashPassword(newPassword);
    await db.update(users).set({ password_hash }).where(eq(users.id, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("PATCH /api/auth/password", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
