"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { DispatchStatus, BookingStatus } from "@mietealle/db";

const ACTIONS: Array<{
  status: DispatchStatus;
  label: string;
  variant: "primary" | "secondary" | "danger";
  allowedBookingStatuses: BookingStatus[];
}> = [
  { status: "DISPATCHED", label: "Versandt", variant: "primary", allowedBookingStatuses: ["CONFIRMED", "ACTIVE"] },
  { status: "DELIVERED", label: "Geliefert", variant: "primary", allowedBookingStatuses: ["DISPATCHED"] },
  { status: "ON_HOLD", label: "Zurückstellen", variant: "secondary", allowedBookingStatuses: ["PENDING", "CONFIRMED"] },
  { status: "RETURN_DISPATCHED", label: "Rückholung gestartet", variant: "secondary", allowedBookingStatuses: ["RETURN_INITIATED", "DELIVERED"] },
  { status: "RETURNED", label: "Zurückgekehrt", variant: "secondary", allowedBookingStatuses: ["RETURN_DISPATCHED", "RETURN_INITIATED"] },
  { status: "CANCELLED", label: "Stornieren", variant: "danger", allowedBookingStatuses: ["PENDING", "CONFIRMED"] },
];

interface Props {
  bookingId: string;
  currentStatus: DispatchStatus;
  bookingStatus: BookingStatus;
}

export function VendorDispatchActions({ bookingId, bookingStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const available = ACTIONS.filter((a) => (a.allowedBookingStatuses as string[]).includes(bookingStatus));
  if (available.length === 0) return <p className="text-xs text-gray-400">Keine Aktionen verfügbar</p>;

  async function dispatch(dispatchStatus: DispatchStatus) {
    setLoading(dispatchStatus);
    await fetch("/api/vendor/dispatch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, dispatchStatus }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((a) => (
        <Button key={a.status} size="sm" variant={a.variant} loading={loading === a.status} onClick={() => dispatch(a.status)}>
          {a.label}
        </Button>
      ))}
    </div>
  );
}
