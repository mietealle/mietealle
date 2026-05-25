"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = params.get("role") === "vendor" ? "VENDOR" : "RENTER";
  const [role, setRole] = useState<"VENDOR" | "RENTER">(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        company: fd.get("company"),
        phone: fd.get("phone"),
        role,
      }),
    });

    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Registrierung fehlgeschlagen.");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold text-brand-700">Mietealle</span>
          <p className="mt-1 text-sm text-gray-500">Konto erstellen</p>
        </div>

        {/* Role toggle */}
        <div className="mb-6 flex rounded-lg border border-gray-200 p-1">
          {(["RENTER", "VENDOR"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                role === r
                  ? "bg-brand-600 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r === "RENTER" ? "Mieter" : "Vermieter"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="name" name="name" label="Name" placeholder="Max Mustermann" required />
          <Input
            id="email"
            name="email"
            type="email"
            label="E-Mail"
            placeholder="firma@beispiel.de"
            required
          />
          <Input
            id="company"
            name="company"
            label="Unternehmen"
            placeholder="Musterbau GmbH"
          />
          <Input
            id="phone"
            name="phone"
            type="tel"
            label="Telefon"
            placeholder="+49 123 456789"
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Passwort"
            placeholder="min. 8 Zeichen"
            required
            minLength={8}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Registrieren
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Bereits registriert?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
