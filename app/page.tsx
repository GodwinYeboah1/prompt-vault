import { Suspense } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Prompt } from "@/lib/types";
import { PromptForm } from "@/app/prompt-form";
import { PromptCard } from "@/app/prompt-card";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="flex-1 bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-8 font-mono text-3xl font-semibold uppercase tracking-[0.25em] text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
          Prompt Vault
        </h1>
        <Suspense fallback={<p className="text-zinc-500">Loading prompts…</p>}>
          <Vault searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Vault({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  // Reading the URL also makes this render fresh on every request.
  const { edit } = await searchParams;

  const { data, error } = await getSupabase()
    .from("prompts")
    .select("id, title, body, tags, favorite, created_at")
    .order("favorite", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<Prompt[]>();

  const prompts = data ?? [];
  // `/?edit=12` opens prompt 12 in the form.
  const editing = prompts.find((prompt) => String(prompt.id) === edit);

  return (
    <>
      <PromptForm key={editing?.id ?? "new"} editing={editing} />
      {error ? (
        <p className="text-red-400">
          Couldn&apos;t load prompts: {error.message}
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
