import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bandes } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [bande] = await getDb().select().from(bandes).where(eq(bandes.id, id));
    if (!bande) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    return NextResponse.json(bande);
  } catch (error) {
    console.error("GET /api/bandes/[id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const db = getDb();
    await db.update(bandes).set(data).where(eq(bandes.id, id));
    const [updated] = await db.select().from(bandes).where(eq(bandes.id, id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/bandes/[id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getDb().delete(bandes).where(eq(bandes.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/bandes/[id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
