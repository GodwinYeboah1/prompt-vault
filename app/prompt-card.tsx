"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  deletePrompt,
  toggleFavorite,
  type ActionResult,
} from "@/app/actions";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import type { Prompt } from "@/lib/types";

const buttonClass =
  "rounded-full bg-gold-400 px-4 py-2 text-caption font-semibold text-black transition hover:bg-gold-300 hover:shadow-[0_0_24px_rgb(212_175_55/0.55)] disabled:cursor-wait disabled:opacity-50";
const dangerButtonClass =
  "rounded-full border border-red-400/25 px-4 py-2 text-caption font-medium text-red-300 transition hover:border-red-400/60 hover:shadow-[0_0_16px_rgb(248_113_113/0.2)] disabled:cursor-wait disabled:opacity-50";

export function PromptCard({
  prompt,
  isEditing,
}: {
  prompt: Prompt;
  isEditing: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  async function copyBody() {
    try {
      await copyToClipboard(prompt.body);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy to the clipboard. Please try again.");
    }
  }

  return (
    <li
      className={`rounded-2xl border bg-card p-6 transition hover:shadow-[0_0_32px_rgb(212_175_55/0.18)] ${
        isEditing
          ? "border-gold-400/70 shadow-[0_0_32px_rgb(212_175_55/0.25)]"
          : "border-gold-400/20 hover:border-gold-400/40"
      } ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-title text-zinc-50">{prompt.title}</h2>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => toggleFavorite(prompt.id, !prompt.favorite))}
          aria-pressed={prompt.favorite}
          aria-label={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
          title={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
          className={`-m-2 p-2 text-xl leading-none transition disabled:cursor-wait ${
            prompt.favorite
              ? "text-gold-400 drop-shadow-[0_0_8px_rgb(212_175_55/0.6)]"
              : "text-zinc-500 hover:text-gold-300"
          }`}
        >
          {prompt.favorite ? "★" : "☆"}
        </button>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-body text-zinc-400">{prompt.body}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {confirmingDelete ? (
          <>
            <span className="mr-1 text-caption text-red-300">Are you sure?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deletePrompt(prompt.id))}
              className={dangerButtonClass}
            >
              {pending ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingDelete(false)}
              className={buttonClass}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <Link
              href={`/?edit=${prompt.id}`}
              scroll={false}
              className={buttonClass}
            >
              Edit
            </Link>
            <button type="button" onClick={copyBody} className={buttonClass}>
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingDelete(true)}
              className={dangerButtonClass}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-caption text-red-400">
          {error}
        </p>
      )}
    </li>
  );
}
