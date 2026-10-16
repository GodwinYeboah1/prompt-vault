import { Suspense } from "react";
import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { lock } from "@/app/auth-actions";
import type { Prompt } from "@/lib/types";
import { PromptForm } from "@/app/prompt-form";
import { PromptCard } from "@/app/prompt-card";
import { CommandPalette } from "@/app/command-palette";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="flex-1 bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-8 flex items-center justify-between gap-4">
          <h1 className="font-mono text-3xl font-semibold uppercase tracking-[0.25em] text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
            Prompt Vault
          </h1>
          <form action={lock}>
            <button
              type="submit"
              className="rounded border border-cyan-400/40 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            >
              Lock
            </button>
          </form>
        </header>
        <Suspense fallback={<p className="text-zinc-500">Loading prompts…</p>}>
          <Vault searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

// The real error is only logged on the server; visitors see a generic message.
async function loadPrompts(): Promise<{
  prompts: Prompt[];
  loadFailed: boolean;
}> {
  // Only query for real requests. Without this, Next.js can start the query
  // while prerendering, cut it off, and we'd log that as a database error.
  await connection();
  // Outside the try: redirect() works by throwing, so catching it would break it.
  await requireSession();

  try {
    const { data, error } = await getSupabase()
      .from("prompts")
      .select("id, title, body, tags, favorite, created_at")
      .order("favorite", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Prompt[]>();

    if (error) {
      console.error("Failed to load prompts:", error);
      return { prompts: [], loadFailed: true };
    }
    return { prompts: data, loadFailed: false };
  } catch (error) {
    // e.g. missing SUPABASE_URL / SUPABASE_SECRET_KEY
    console.error("Failed to load prompts:", error);
    return { prompts: [], loadFailed: true };
  }
}

async function Vault({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  // Reading the URL also makes this render fresh on every request.
  const { edit } = await searchParams;

  const { prompts, loadFailed } = await loadPrompts();
  // `/?edit=12` opens prompt 12 in the form.
  const editing = prompts.find((prompt) => String(prompt.id) === edit);

  return (
    <>
      {/* Only the prompt rows are sent to the browser; the Supabase client and
          secret key stay on the server. */}
      <CommandPalette prompts={prompts} loadFailed={loadFailed} />
      <PromptForm key={editing?.id ?? "new"} editing={editing} />
      {loadFailed ? (
        <p
          role="alert"
          className="rounded-lg border border-red-400/50 bg-red-950/30 px-4 py-3 text-red-300 shadow-[0_0_12px_rgba(248,113,113,0.25)]"
        >
          Couldn&apos;t connect to the database. Please try again in a moment.
        </p>
      ) : prompts.length === 0 ? (
        <p className="text-zinc-500">No prompts yet.</p>
      ) : (
        <ul className="space-y-4">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isEditing={prompt.id === editing?.id}
            />
          ))}
        </ul>
      )}
    </>
  );
}
