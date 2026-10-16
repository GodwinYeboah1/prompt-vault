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
  "rounded border border-cyan-400/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] disabled:cursor-wait disabled:opacity-50";
const dangerButtonClass =
  "rounded border border-red-400/50 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-red-300 transition hover:border-red-300 hover:shadow-[0_0_10px_rgba(248,113,113,0.5)] disabled:cursor-wait disabled:opacity-50";

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
      className={`rounded-lg border bg-zinc-900/60 p-5 transition ${
        isEditing
          ? "border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]"
          : "border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.12)]"
      } ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-medium text-cyan-100">{prompt.title}</h2>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => toggleFavorite(prompt.id, !prompt.favorite))}
          aria-pressed={prompt.favorite}
          aria-label={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
          title={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
          className={`text-2xl leading-none transition disabled:cursor-wait ${
            prompt.favorite
              ? "text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]"
              : "text-zinc-600 hover:text-cyan-300"
          }`}
        >
          {prompt.favorite ? "★" : "☆"}
        </button>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-zinc-400">{prompt.body}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {confirmingDelete ? (
          <>
            <span className="mr-1 text-sm text-red-300">Are you sure?</span>
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
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </li>
  );
}
