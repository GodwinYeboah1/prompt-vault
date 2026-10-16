import { Suspense } from "react";
import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase";

type Prompt = {
  id: string;
  title: string;
  body: string;
  tags: string[] | null;
  favorite: boolean;
  created_at: string;
};

export default function Home() {
  return (
    <main className="flex-1 bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">
          Prompt Vault
        </h1>
        <Suspense fallback={<p className="text-zinc-500">Loading prompts…</p>}>
          <PromptList />
        </Suspense>
      </div>
    </main>
  );
}

async function PromptList() {
  // Always read fresh rows at request time instead of prerendering them.
  await connection();

  const { data, error } = await getSupabase()
    .from("prompts")
    .select("id, title, body, tags, favorite, created_at")
    .order("created_at", { ascending: false })
    .returns<Prompt[]>();

  if (error) {
    return (
      <p className="text-red-400">Couldn&apos;t load prompts: {error.message}</p>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-zinc-500">No prompts yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {data.map((prompt) => (
        <li
          key={prompt.id}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
        >
          <h2 className="text-lg font-medium">{prompt.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-zinc-400">
            {prompt.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
