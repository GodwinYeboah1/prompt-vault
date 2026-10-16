import type { Metadata } from "next";
import { UnlockForm } from "@/app/login/unlock-form";

export const metadata: Metadata = {
  title: "Locked · Prompt Vault",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-100">
      <UnlockForm />
    </main>
  );
}
