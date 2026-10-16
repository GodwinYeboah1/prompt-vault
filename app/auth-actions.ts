"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  isCorrectPasscode,
  isPasscodeConfigured,
} from "@/lib/session";

// `attempt` changes on every failure so the form can replay its shake.
export type UnlockState = { error?: string; attempt?: number };

export async function unlock(
  prevState: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  if (!isPasscodeConfigured()) {
    console.error("VAULT_PASSCODE is not set; nobody can unlock the vault.");
    return {
      error: "The vault isn't set up yet. Set VAULT_PASSCODE on the server.",
      attempt: (prevState.attempt ?? 0) + 1,
    };
  }

  const passcode = String(formData.get("passcode") ?? "");
  if (!isCorrectPasscode(passcode)) {
    // Slow down repeated guessing.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Access denied.", attempt: (prevState.attempt ?? 0) + 1 };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true, // page JavaScript can't read it
    // Browsers only keep Secure cookies over https (or localhost), so it's
    // relaxed in development to keep the plain-http LAN address working.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function lock() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
