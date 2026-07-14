import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "snr_session";
const SESSION_DURATION = "7d";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to your environment.",
      );
    }
    console.warn(
      "[auth] SESSION_SECRET is not set — using an insecure dev-only key. Set SESSION_SECRET before deploying.",
    );
  }
  return new TextEncoder().encode(secret || "dev-only-insecure-secret-change-me");
}

export interface SessionPayload {
  username: string;
}

async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.username !== "string") return null;
    return { username: payload.username };
  } catch {
    return null;
  }
}

export async function createSession(username: string): Promise<void> {
  const token = await encrypt({ username });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(COOKIE_NAME)?.value);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Used by proxy.ts, which reads the raw cookie value itself. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  return decrypt(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
