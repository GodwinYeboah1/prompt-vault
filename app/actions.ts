"use server";

import { refresh } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export type SavePromptState = {
  status: "idle" | "success" | "error";
  message?: string;
  // Sent back on failure so the form can keep what the user typed.
  fields?: { title: string; body: string; tags: string };
};

export type ActionResult = { error?: string };

function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Creates a new prompt, or updates an existing one when the form includes an id.
export async function savePrompt(
  _prevState: SavePromptState,
  formData: FormData,
): Promise<SavePromptState> {
  const rawId = formData.get("id");
  const id = rawId ? parseId(rawId) : null;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rawTags = String(formData.get("tags") ?? "");
  const fields = { title, body, tags: rawTags };

  if (rawId && !id) {
    return { status: "error", message: "That prompt couldn't be found.", fields };
  }

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
  const row = { title, body, tags };
  const prompts = getSupabase().from("prompts");

  if (id) {
    const { data, error } = await prompts.update(row).eq("id", id).select("id");
    if (error) {
      console.error("Failed to update prompt:", error);
      return {
        status: "error",
        message: "Couldn't save your changes. Please try again in a moment.",
        fields,
      };
    }
    if (data.length === 0) {
      return {
        status: "error",
        message: "That prompt no longer exists. It may have been deleted.",
        fields,
      };
    }
    // Leave edit mode. The redirect also sends back the updated list.
    redirect("/", RedirectType.replace);
  }

  const { error } = await prompts.insert(row);
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

export async function toggleFavorite(
  id: number,
  favorite: boolean,
): Promise<ActionResult> {
  if (!parseId(id)) return { error: "That prompt couldn't be found." };

  const { error } = await getSupabase()
    .from("prompts")
    .update({ favorite })
    .eq("id", id);

  if (error) {
    console.error("Failed to update favorite:", error);
    return { error: "Couldn't update the favorite. Please try again." };
  }

  refresh();
  return {};
}

export async function deletePrompt(id: number): Promise<ActionResult> {
  if (!parseId(id)) return { error: "That prompt couldn't be found." };

  const { error } = await getSupabase().from("prompts").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete prompt:", error);
    return { error: "Couldn't delete the prompt. Please try again." };
  }

  refresh();
  return {};
}
