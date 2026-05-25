"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle } from "lucide-react";
import type { BookingStatus } from "@mietealle/db";

const NEXT_ACTIONS: Partial<Record<BookingStatus, Array<{ status: BookingStatus; label: string; variant: "primary" | "secondary" | "danger" }>>> = {
  PENDING:    [{ status: "CONFIRMED", label: "Bestätigen",  variant: "primary"    },
               { status: "CANCELLED", label: "Ablehnen",    variant: "danger"     }],
  CONFIRMED:  [{ status: "ACTIVE",    label: "Aktivieren",  variant: "primary"    },
               { status: "CANCELLED", label: "Stornieren",  variant: "danger"     }],
  RETURNED:   [{ status: "COMPLETED", label: "Abschließen", variant: "primary"    }],
  DELIVERED:  [{ status: "COMPLETED", label: "Abschließen", variant: "secondary"  }],
};

interface Props {
  bookingId: string;
  currentStatus: string;
  showDelete?: boolean;
}

export function AdminBookingActions({ bookingId, currentStatus, showDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const actions = NEXT_ACTIONS[currentStatus as BookingStatus] ?? [];

  async function updateStatus(status: BookingStatus) {
    setLoading(status);
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, status }),
    });
    setLoading(null);
    router.refresh();
  }

  async function deleteBooking() {
    setLoading("delete");
    await fetch(`/api/admin/bookings?id=${bookingId}`, { method: "DELETE" });
    setLoading(null);
    router.push("/admin/bookings");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => (
        <Button key={a.status} size="sm" variant={a.variant}
          loading={loading === a.status} onClick={() => updateStatus(a.status)}>
          {a.variant === "primary" ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {a.label}
        </Button>
      ))}

      {showDelete && (
        confirmDel ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600">Wirklich löschen?</span>
            <Button size="sm" variant="danger" loading={loading === "delete"} onClick={deleteBooking}>Ja</Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirmDel(false)}>Nein</Button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)}
            className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        )
      )}
    </div>
  );
}
