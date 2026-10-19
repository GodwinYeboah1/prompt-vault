"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { savePrompt, type SavePromptState } from "@/app/actions";
import type { Prompt } from "@/lib/types";

const initialState: SavePromptState = { status: "idle" };

const labelClass = "mb-2 block text-label uppercase text-zinc-400";
// 16px text keeps iOS Safari from zooming in when a field is focused.
const inputClass =
  "w-full rounded-xl border border-gold-400/20 bg-ink px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-gold-400/60 focus:shadow-[0_0_0_4px_rgb(212_175_55/0.12),0_0_20px_rgb(212_175_55/0.12)]";

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
      className="mb-12 scroll-mt-6 space-y-6 rounded-2xl border border-gold-400/20 bg-card p-6 transition hover:shadow-[0_0_32px_rgb(212_175_55/0.12)] sm:mb-16 sm:p-8"
    >
      <h2 className="text-headline text-zinc-50">
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
          Tags <span className="tracking-normal text-zinc-500 normal-case">(comma-separated, optional)</span>
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
          className="rounded-full bg-gold-400 px-6 py-3 text-caption font-semibold text-black transition hover:bg-gold-300 hover:shadow-[0_0_24px_rgb(212_175_55/0.55)] disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Saving…" : editing ? "Save changes" : "Save prompt"}
        </button>
        {editing && (
          <Link
            href="/"
            replace
            scroll={false}
            className="text-caption font-medium text-zinc-400 transition hover:text-gold-200"
          >
            Cancel
          </Link>
        )}
        <p aria-live="polite" className="text-caption">
          {state.status === "error" && (
            <span className="text-red-400">{state.message}</span>
          )}
          {state.status === "success" && !pending && (
            <span className="text-gold-300">Prompt saved.</span>
          )}
        </p>
      </div>
    </form>
  );
}
