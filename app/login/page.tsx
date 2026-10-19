import type { Metadata } from "next";
import { UnlockForm } from "@/app/login/unlock-form";

export const metadata: Metadata = {
  title: "Locked · Prompt Vault",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12 text-zinc-100 sm:px-6 sm:py-16">
      <UnlockForm />
    </main>
  );
}
