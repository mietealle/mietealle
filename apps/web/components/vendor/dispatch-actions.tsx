"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { DispatchStatus, BookingStatus } from "@mietealle/db";

// Actions that update BookingStatus directly (confirm / reject from PENDING)
const BOOKING_ACTIONS: Array<{
  status: BookingStatus;
  label: string;
  variant: "primary" | "secondary" | "danger";
  allowedBookingStatuses: BookingStatus[];
}> = [
  {
    status: "CONFIRMED",
    label: "Bestätigen",
    variant: "primary",
    allowedBookingStatuses: ["PENDING"],
  },
  {
    status: "CANCELLED",
    label: "Ablehnen",
    variant: "danger",
    allowedBookingStatuses: ["PENDING"],
  },
];

// Actions that update DispatchStatus (and cascade BookingStatus via dispatch API)
const DISPATCH_ACTIONS: Array<{
  status: DispatchStatus;
  label: string;
  variant: "primary" | "secondary" | "danger";
  allowedBookingStatuses: BookingStatus[];
}> = [
  {
    status: "DISPATCHED",
    label: "Versandt",
    variant: "primary",
    allowedBookingStatuses: ["CONFIRMED", "ACTIVE"],
  },
  {
    status: "DELIVERED",
    label: "Geliefert",
    variant: "primary",
    allowedBookingStatuses: ["DISPATCHED"],
  },
  {
    status: "ON_HOLD",
    label: "Zurückstellen",
    variant: "secondary",
    allowedBookingStatuses: ["CONFIRMED"],
  },
  {
    status: "RETURN_DISPATCHED",
    label: "Rückholung gestartet",
    variant: "secondary",
    allowedBookingStatuses: ["RETURN_INITIATED", "DELIVERED"],
  },
  {
    status: "RETURNED",
    label: "Zurückgegeben",
    variant: "secondary",
    allowedBookingStatuses: ["RETURN_DISPATCHED", "RETURN_INITIATED"],
  },
  {
    status: "CANCELLED",
    label: "Stornieren",
    variant: "danger",
    allowedBookingStatuses: ["CONFIRMED"],
  },
];

interface Props {
  bookingId: string;
  currentStatus: DispatchStatus;
  bookingStatus: BookingStatus;
}

export function VendorDispatchActions({ bookingId, bookingStatus }: Props) {
  const router = useRouter();
  const { error: showError, success } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const availableBookingActions = BOOKING_ACTIONS.filter((a) =>
    (a.allowedBookingStatuses as string[]).includes(bookingStatus)
  );
  const availableDispatchActions = DISPATCH_ACTIONS.filter((a) =>
    (a.allowedBookingStatuses as string[]).includes(bookingStatus)
  );

  const allActions = availableBookingActions.length + availableDispatchActions.length;
  if (allActions === 0) {
    return <p className="text-xs text-gray-400">Keine Aktionen verfügbar</p>;
  }

  async function handleBookingAction(status: BookingStatus) {
    const key = `booking_${status}`;
    setLoading(key);
    try {
      const res = await fetch("/api/vendor/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        showError(data.error ?? "Aktion fehlgeschlagen. Bitte erneut versuchen.");
        return;
      }
      success(status === "CONFIRMED" ? "Buchung bestätigt." : "Buchung abgelehnt.");
      router.refresh();
    } catch {
      showError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDispatchAction(dispatchStatus: DispatchStatus) {
    const key = `dispatch_${dispatchStatus}`;
    setLoading(key);
    try {
      const res = await fetch("/api/vendor/dispatch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, dispatchStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        showError(data.error ?? "Aktion fehlgeschlagen. Bitte erneut versuchen.");
        return;
      }
      success("Status erfolgreich aktualisiert.");
      router.refresh();
    } catch {
      showError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableBookingActions.map((a) => (
        <Button
          key={a.status}
          size="sm"
          variant={a.variant}
          loading={loading === `booking_${a.status}`}
          onClick={() => handleBookingAction(a.status)}
        >
          {a.label}
        </Button>
      ))}
      {availableDispatchActions.map((a) => (
        <Button
          key={a.status}
          size="sm"
          variant={a.variant}
          loading={loading === `dispatch_${a.status}`}
          onClick={() => handleDispatchAction(a.status)}
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}
