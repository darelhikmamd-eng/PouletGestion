import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "poulet-tech-secret-key-change-in-production-32chars"
);
export const COOKIE_NAME = "poulet_session";
const SESSION_DURATION = "7d";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// ─── Password ────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Session payload ─────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  farmId: string;
  email: string;
  nomFerme: string;
}

// ─── JWT Helpers ─────────────────────────────────────────────────────────────

export async function createJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Cookie options ───────────────────────────────────────────────────────────

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,   // lax allows redirects to carry the cookie
    maxAge: MAX_AGE,
    path: "/",
  };
}

// ─── Set cookie directly on a NextResponse (correct way in Route Handlers) ────

export async function createSessionResponse(
  payload: SessionPayload,
  body: object,
  status = 200
): Promise<NextResponse> {
  const token = await createJWT(payload);
  const res = NextResponse.json(body, { status });
  res.cookies.set(COOKIE_NAME, token, cookieOptions());
  return res;
}

// ─── Delete cookie directly on a NextResponse ─────────────────────────────────

export function deleteSessionResponse(): NextResponse {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
  return res;
}

// ─── Read session from Server Components (next/headers) ──────────────────────

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyJWT(token);
  } catch {
    return null;
  }
}

// ─── Read session from Request (Middleware / Route Handlers) ─────────────────

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

// ─── ID Generator ────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
