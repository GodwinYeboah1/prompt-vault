"use client";

import { useActionState } from "react";
import { unlock, type UnlockState } from "@/app/auth-actions";

const initialState: UnlockState = {};

export function UnlockForm() {
  const [state, formAction, pending] = useActionState(unlock, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm animate-hud-in rounded-2xl border border-gold-400/20 bg-card px-6 py-10 text-center shadow-[0_0_60px_rgb(212_175_55/0.1)] sm:px-8"
    >
      {/* Arc-reactor style rings */}
      <div className="relative mx-auto mb-8 size-28">
        <div className="absolute inset-0 rounded-full border border-gold-400/50 shadow-[0_0_24px_rgb(212_175_55/0.25)]" />
        <div className="absolute inset-3 animate-[spin_12s_linear_infinite] rounded-full border border-dashed border-gold-400/35" />
        <div
          className={`absolute inset-8 rounded-full border transition ${
            state.error
              ? "border-red-400/80 bg-red-400/20 shadow-[0_0_20px_rgb(248_113_113/0.5)]"
              : "border-gold-300/80 bg-gold-400/20 shadow-[0_0_20px_rgb(212_175_55/0.5)]"
          }`}
        />
      </div>

      <h1 className="text-display text-zinc-50">
        Vault locked
      </h1>
      <p className="mt-3 text-label uppercase text-zinc-400">
        Identity verification required
      </p>

      <label htmlFor="passcode" className="sr-only">
        Passcode
      </label>
      <input
        id="passcode"
        name="passcode"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Enter passcode"
        // Remount after each failed attempt so the field clears and the
        // shake replays.
        key={state.attempt ?? 0}
        className={`mt-8 w-full rounded-full border bg-ink px-5 py-3 text-center text-base tracking-[0.3em] text-zinc-100 placeholder:tracking-normal placeholder:text-zinc-500 outline-none transition ${
          state.error
            ? "animate-shake border-red-400/70 focus:shadow-[0_0_0_4px_rgb(248_113_113/0.12)]"
            : "border-gold-400/20 focus:border-gold-400/60 focus:shadow-[0_0_0_4px_rgb(212_175_55/0.12),0_0_20px_rgb(212_175_55/0.12)]"
        }`}
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-3 w-full rounded-full bg-gold-400 py-3 text-caption font-semibold text-black transition hover:bg-gold-300 hover:shadow-[0_0_24px_rgb(212_175_55/0.55)] disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Unlock"}
      </button>

      <p
        aria-live="polite"
        className="mt-4 min-h-5 text-caption text-red-400"
      >
        {state.error}
      </p>
    </form>
  );
}
