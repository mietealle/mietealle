"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface Props { bookingId: string; hasTransport: boolean }

export function ReturnActions({ bookingId, hasTransport }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function initiateReturn() {
    setLoading(true);
    await fetch("/api/renter/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    setLoading(false);
    router.refresh();
  }

  if (confirmed) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
        <p className="text-sm text-yellow-700 mb-2">
          {hasTransport
            ? "Der Vermieter wird die Abholung koordinieren. Bitte halten Sie die Maschine bereit."
            : "Da Sie Selbstabholung gewählt haben, bringen Sie die Maschine bitte zum Vermieter zurück."}
        </p>
        <div className="flex gap-2">
          <Button size="sm" loading={loading} onClick={initiateReturn}>Rückgabe bestätigen</Button>
          <Button size="sm" variant="secondary" onClick={() => setConfirmed(false)}>Abbrechen</Button>
        </div>
      </div>
    );
  }

  return (
    <Button size="sm" variant="secondary" onClick={() => setConfirmed(true)}>
      <RotateCcw className="h-4 w-4" /> Rückgabe einleiten
    </Button>
  );
}
