"use server";

import { refresh } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export type CreatePromptState = {
  status: "idle" | "success" | "error";
  message?: string;
  // Sent back on failure so the form can keep what the user typed.
  fields?: { title: string; body: string; tags: string };
};

export async function createPrompt(
  _prevState: CreatePromptState,
  formData: FormData,
): Promise<CreatePromptState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rawTags = String(formData.get("tags") ?? "");
  const fields = { title, body, tags: rawTags };

  // The browser enforces `required`, but Server Actions can be called
  // directly, so check again here.
  if (!title || !body) {
    return {
      status: "error",
      message: "Give your prompt a title and a body before saving.",
      fields,
    };
  }

  const tags = rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const { error } = await getSupabase()
    .from("prompts")
    .insert({ title, body, tags });

  if (error) {
    console.error("Failed to save prompt:", error);
    return {
      status: "error",
      message: "Couldn't save your prompt. Please try again in a moment.",
      fields,
    };
  }

  // Re-render the page so the new prompt shows up in the list.
  refresh();
  return { status: "success" };
}
