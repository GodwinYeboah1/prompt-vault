import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "vault_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

function getPasscode(): string | null {
  return process.env.VAULT_PASSCODE || null;
}

// Compares in constant time so response timing doesn't reveal how much of a
// guess was right. Hashing first gives both sides the same length.
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}

function sign(value: string, passcode: string): string {
  return createHmac("sha256", passcode)
    .update(`prompt-vault-session:${value}`)
    .digest("base64url");
}

export function isPasscodeConfigured(): boolean {
  return getPasscode() !== null;
}

export function isCorrectPasscode(input: string): boolean {
  const passcode = getPasscode();
  return passcode !== null && safeEqual(input, passcode);
}

// The cookie holds an expiry time plus a signature made with the passcode.
// It never contains the passcode, can't be forged without it, and changing
// VAULT_PASSCODE invalidates every existing session.
export function createSessionToken(): string {
  const passcode = getPasscode();
  if (!passcode) throw new Error("VAULT_PASSCODE is not set.");
  const expiresAt = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${expiresAt}.${sign(expiresAt, passcode)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  const passcode = getPasscode();
  if (!passcode || !token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt, passcode))) return false;
  return Number(expiresAt) > Date.now();
}

// Second line of defense behind proxy.ts: call this in every Server Action
// and data load, since those can be reached by direct POST requests.
export async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) redirect("/login");
}
