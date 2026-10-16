"use client";

import { useActionState } from "react";
import { unlock, type UnlockState } from "@/app/auth-actions";

const initialState: UnlockState = {};

export function UnlockForm() {
  const [state, formAction, pending] = useActionState(unlock, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm animate-hud-in rounded-2xl border border-cyan-300/60 bg-zinc-900/50 p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.25),inset_0_0_30px_rgba(34,211,238,0.06)] backdrop-blur"
    >
      {/* Arc-reactor style rings */}
      <div className="relative mx-auto mb-8 size-28">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-300/70 shadow-[0_0_24px_rgba(34,211,238,0.6)]" />
        <div className="absolute inset-3 animate-[spin_8s_linear_infinite] rounded-full border border-dashed border-cyan-300/60" />
        <div
          className={`absolute inset-8 rounded-full border shadow-[0_0_18px_rgba(34,211,238,0.8)] transition ${
            state.error
              ? "border-red-400 bg-red-400/20 shadow-[0_0_18px_rgba(248,113,113,0.8)]"
              : "border-cyan-200 bg-cyan-300/20"
          }`}
        />
      </div>

      <h1 className="font-mono text-xl uppercase tracking-[0.35em] text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
        Vault locked
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
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
        className={`mt-8 w-full rounded-md border bg-zinc-950/80 px-4 py-3 text-center font-mono tracking-[0.3em] text-cyan-100 placeholder:tracking-[0.2em] placeholder:text-zinc-600 outline-none transition focus:shadow-[0_0_16px_rgba(34,211,238,0.55)] ${
          state.error
            ? "animate-shake border-red-400/70"
            : "border-cyan-400/50 focus:border-cyan-300"
        }`}
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-md border border-cyan-300 bg-cyan-400/10 py-3 font-mono text-sm uppercase tracking-[0.3em] text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.45)] transition hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.7)] disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Unlock"}
      </button>

      <p
        aria-live="polite"
        className="mt-4 min-h-5 font-mono text-sm uppercase tracking-[0.25em] text-red-400"
      >
        {state.error}
      </p>
    </form>
  );
}
