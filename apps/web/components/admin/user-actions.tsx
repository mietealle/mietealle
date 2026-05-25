"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Info } from "lucide-react";

interface Props {
  userId: string;
  currentCommission: number | null;
}

export function AdminUserActions({ userId, currentCommission }: Props) {
  const router = useRouter();
  const [commission, setCommission] = useState(
    currentCommission != null ? String(currentCommission) : "10"
  );
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone]       = useState<"approved" | "rejected" | null>(null);

  async function update(verificationStatus: "APPROVED" | "REJECTED") {
    setLoading(verificationStatus === "APPROVED" ? "approve" : "reject");
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId, verificationStatus,
        ...(verificationStatus === "APPROVED" ? { commissionRate: parseFloat(commission) || 10 } : {}),
      }),
    });
    setDone(verificationStatus === "APPROVED" ? "approved" : "rejected");
    setLoading(null);
    router.refresh();
  }

  if (done === "approved") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-semibold text-green-800">Vermieter freigegeben</p>
          <p className="text-xs text-green-600">Provision: {commission}% · Vermieter wurde benachrichtigt.</p>
        </div>
      </div>
    );
  }
  if (done === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3">
        <XCircle className="h-5 w-5 text-red-500" />
        <p className="text-sm font-semibold text-red-700">Antrag abgelehnt</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 min-w-[220px]">
      {/* Commission input */}
      <div className="rounded-xl bg-gray-50 p-3">
        <div className="mb-1 flex items-center gap-1">
          <label htmlFor={`comm-${userId}`} className="text-xs font-semibold text-gray-700">
            Plattform-Provision
          </label>
          <span title="Anteil, den Mietealle vom Bruttoumsatz des Vermieters einbehält.">
            <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            id={`comm-${userId}`}
            type="number" min="0" max="50" step="0.5"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-medium focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-600">% vom Umsatz</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">Standard: 10% · Max. empfohlen: 20%</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button size="sm" variant="primary" loading={loading === "approve"}
          onClick={() => update("APPROVED")} className="flex-1 gap-1.5">
          <CheckCircle className="h-4 w-4" /> Freigeben
        </Button>
        <Button size="sm" variant="danger" loading={loading === "reject"}
          onClick={() => update("REJECTED")} className="flex-1 gap-1.5">
          <XCircle className="h-4 w-4" /> Ablehnen
        </Button>
      </div>
    </div>
  );
}
