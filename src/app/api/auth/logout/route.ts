import { NextResponse } from "next/server";
import { deleteSessionResponse } from "@/lib/auth";

export async function POST() {
  // ✅ Cookie supprimé directement sur la réponse HTTP
  return deleteSessionResponse();
}
