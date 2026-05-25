"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    params.get("error") ? "Ungültige Anmeldedaten." : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Ungültige E-Mail oder Passwort.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold text-brand-700">Mietealle</span>
          <p className="mt-1 text-sm text-gray-500">Anmelden</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="E-Mail"
            placeholder="firma@beispiel.de"
            required
            autoComplete="email"
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Passwort"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Anmelden
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Noch kein Konto?{" "}
          <Link href="/register" className="text-brand-600 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
