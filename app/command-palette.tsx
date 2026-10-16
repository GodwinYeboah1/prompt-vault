"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import type { Prompt } from "@/lib/types";

const MAX_RESULTS = 8;

// Every word typed must appear in the title, tags or body. Title matches
// rank highest, then tags, then body; ties keep the page's order
// (favorites first, then newest).
function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return prompts.slice(0, MAX_RESULTS);

  const scored: { prompt: Prompt; score: number }[] = [];
  for (const prompt of prompts) {
    const title = prompt.title.toLowerCase();
    const tags = (prompt.tags ?? []).join(" ").toLowerCase();
    const body = prompt.body.toLowerCase();

    let score = 0;
    for (const word of words) {
      if (title.includes(word)) score += title.startsWith(word) ? 4 : 3;
      else if (tags.includes(word)) score += 2;
      else if (body.includes(word)) score += 1;
      else {
        score = 0;
        break;
      }
    }
    if (score > 0) scored.push({ prompt, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((entry) => entry.prompt);
}

// Mac or not can only be known in the browser; the server renders "Ctrl".
function useIsMac() {
  return useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
}

export function CommandPalette({
  prompts,
  loadFailed,
}: {
  prompts: Prompt[];
  loadFailed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copyError, setCopyError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isMac = useIsMac();

  const results = useMemo(() => searchPrompts(prompts, query), [prompts, query]);
  const active = results[activeIndex];

  // Start fresh next time: runs however the dialog closes (Esc, click
  // outside, Cmd+K again, or after copying).
  function handleClose() {
    clearTimeout(closeTimer.current);
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setCopiedId(null);
    setCopyError(false);
  }

  // Cmd+K / Ctrl+K toggles the palette from anywhere on the page.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((isOpen) => !isOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Keep the native <dialog> in sync with `open`. showModal() keeps focus
  // inside the pop-up and makes Esc close it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Keep the highlighted result visible while arrowing through a long list.
  useEffect(() => {
    if (!active) return;
    document
      .getElementById(`palette-option-${active.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  async function copy(prompt: Prompt) {
    try {
      await copyToClipboard(prompt.body);
      setCopyError(false);
      setCopiedId(prompt.id);
      // Show "Copied!" briefly, then get out of the way.
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setOpen(false), 700);
    } catch {
      setCopyError(true);
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && active) {
      event.preventDefault();
      copy(active);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex w-full items-center justify-between rounded-lg border border-cyan-400/30 bg-zinc-900/40 px-4 py-2.5 text-left text-zinc-500 shadow-[0_0_10px_rgba(34,211,238,0.1)] transition hover:border-cyan-300/60 hover:text-zinc-300 hover:shadow-[0_0_14px_rgba(34,211,238,0.3)]"
      >
        <span>Search prompts…</span>
        <kbd className="rounded border border-cyan-400/40 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        // Clicking the blurred area outside the panel closes it.
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        aria-label="Search prompts"
        className="mx-auto mt-[15vh] w-[min(40rem,calc(100%-2rem))] overflow-hidden rounded-xl border border-cyan-300/70 bg-zinc-950/70 p-0 text-zinc-100 shadow-[0_0_40px_rgba(34,211,238,0.35),inset_0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl open:animate-hud-in backdrop:bg-zinc-950/50 backdrop:backdrop-blur-sm backdrop:animate-fade-in"
      >
        <div className="border-b border-cyan-400/30 px-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search by title, body or tag…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={
              active ? `palette-option-${active.id}` : undefined
            }
            className="w-full bg-transparent py-4 font-mono text-cyan-100 placeholder:text-cyan-100/30 outline-none"
          />
        </div>

        {loadFailed ? (
          <p role="alert" className="px-4 py-6 text-center text-sm text-red-400">
            Couldn&apos;t connect to the database, so there&apos;s nothing to
            search.
          </p>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">
            {prompts.length === 0 ? "No prompts yet." : "No matching prompts."}
          </p>
        ) : (
          <ul
            id="palette-results"
            role="listbox"
            className="max-h-[50vh] overflow-y-auto p-2"
          >
            {results.map((prompt, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={prompt.id}
                  id={`palette-option-${prompt.id}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => copy(prompt)}
                  className={`cursor-pointer rounded-lg border px-3 py-2.5 transition ${
                    isActive
                      ? "border-cyan-300/70 bg-cyan-400/10 shadow-[0_0_14px_rgba(34,211,238,0.35)]"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-cyan-100">
                      {prompt.favorite && (
                        <span className="mr-1.5 text-amber-300">★</span>
                      )}
                      {prompt.title}
                    </span>
                    {copiedId === prompt.id && (
                      <span className="shrink-0 font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                        Copied!
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-zinc-400">
                    {prompt.body}
                  </p>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {prompt.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-cyan-400/30 px-1.5 font-mono text-[0.7rem] text-cyan-300/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-cyan-400/30 px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-zinc-500">
          {copyError ? (
            <span className="normal-case tracking-normal text-red-400">
              Couldn&apos;t copy to the clipboard. Please try again.
            </span>
          ) : (
            <span>↑↓ Move · Enter Copy · Esc Close</span>
          )}
          <span>
            {results.length} of {prompts.length}
          </span>
        </div>
      </dialog>
    </>
  );
}
