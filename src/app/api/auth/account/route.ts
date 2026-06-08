import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionFromRequest, verifyPassword, deleteSessionResponse } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { password } = await req.json().catch(() => ({}));
    if (!password) {
      return NextResponse.json(
        { error: "Veuillez confirmer avec votre mot de passe." },
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

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Mot de passe incorrect. Suppression annulée." },
        { status: 401 }
      );
    }

    // ON DELETE CASCADE supprime automatiquement bandes/consommations/sante/sorties
    await db.delete(users).where(eq(users.id, session.userId));

    // Efface le cookie de session
    return deleteSessionResponse();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("DELETE /api/auth/account", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
