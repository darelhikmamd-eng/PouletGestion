import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bandes } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

function getFarmId(req: NextRequest): string | null {
  return req.headers.get("x-farm-id");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const [bande] = await getDb()
      .select()
      .from(bandes)
      .where(and(eq(bandes.id, id), eq(bandes.farm_id, farmId)));

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
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const data = await req.json();
    const db = getDb();
    await db.update(bandes).set(data).where(and(eq(bandes.id, id), eq(bandes.farm_id, farmId)));
    const [updated] = await db.select().from(bandes).where(eq(bandes.id, id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/bandes/[id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await getDb().delete(bandes).where(and(eq(bandes.id, id), eq(bandes.farm_id, farmId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/bandes/[id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
