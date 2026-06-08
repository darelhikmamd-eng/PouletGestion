import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

function getFarmId(req: NextRequest): string | null {
  return req.headers.get("x-farm-id");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const farmId = getFarmId(req);
    if (!farmId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await getDb()
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.farm_id, farmId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("DELETE /api/documents/[id]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
