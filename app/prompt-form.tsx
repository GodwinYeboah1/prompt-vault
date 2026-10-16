"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { savePrompt, type SavePromptState } from "@/app/actions";
import type { Prompt } from "@/lib/types";

const initialState: SavePromptState = { status: "idle" };

const labelClass =
  "mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-cyan-300";
const inputClass =
  "w-full rounded-md border border-cyan-400/40 bg-zinc-950/80 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 shadow-[0_0_8px_rgba(34,211,238,0.15)] outline-none transition focus:border-cyan-300 focus:shadow-[0_0_14px_rgba(34,211,238,0.55)]";

export function PromptForm({ editing }: { editing?: Prompt }) {
  const [state, formAction, pending] = useActionState(
    savePrompt,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const editingId = editing?.id;

  // When Edit is clicked further down the list, bring the form into view.
  useEffect(() => {
    if (editingId === undefined) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    titleRef.current?.focus({ preventScroll: true });
  }, [editingId]);

  // React clears the form after each submit; on failure these defaults
  // put the user's input back. In edit mode they start as the saved prompt.
  const values =
    state.status === "error" && state.fields
      ? state.fields
      : editing
        ? {
            title: editing.title,
            body: editing.body,
            tags: (editing.tags ?? []).join(", "),
          }
        : undefined;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mb-12 scroll-mt-6 space-y-5 rounded-xl border border-cyan-400/60 bg-zinc-900/60 p-6 shadow-[0_0_24px_rgba(34,211,238,0.25)]"
    >
      <h2 className="font-mono text-sm uppercase tracking-[0.3em] text-cyan-300">
        {editing ? "Edit prompt" : "New prompt"}
      </h2>

      {editing && <input type="hidden" name="id" value={editing.id} />}

      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          ref={titleRef}
          id="title"
          name="title"
          required
          defaultValue={values?.title}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="body" className={labelClass}>
          Body
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={8}
          defaultValue={values?.body}
          className={`${inputClass} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="tags" className={labelClass}>
          Tags <span className="text-zinc-500 normal-case">(comma-separated, optional)</span>
        </label>
        <input
          id="tags"
          name="tags"
          placeholder="writing, coding, ideas"
          defaultValue={values?.tags}
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-cyan-300 bg-cyan-400/10 px-5 py-2 font-mono text-sm uppercase tracking-[0.2em] text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.45)] transition hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.7)] disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Saving…" : editing ? "Save changes" : "Save prompt"}
        </button>
        {editing && (
          <Link
            href="/"
            replace
            scroll={false}
            className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-400 transition hover:text-cyan-200"
          >
            Cancel
          </Link>
        )}
        <p aria-live="polite" className="text-sm">
          {state.status === "error" && (
            <span className="text-red-400">{state.message}</span>
          )}
          {state.status === "success" && !pending && (
            <span className="text-cyan-300">Prompt saved.</span>
          )}
        </p>
      </div>
    </form>
  );
}
