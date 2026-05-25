import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge, bookingStatusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AdminBookingActions } from "@/components/admin/booking-actions";
import { Eye } from "lucide-react";
import type { BookingStatus } from "@mietealle/db";

export const metadata: Metadata = { title: "Buchungsverwaltung" };

const STATUS_LABEL: Record<string, string> = {
  PENDING:"Anfrage", CONFIRMED:"Bestätigt", ACTIVE:"Aktiv",
  DISPATCHED:"Versendet", DELIVERED:"Geliefert",
  RETURN_INITIATED:"Rückgabe", RETURN_DISPATCHED:"Rückversand",
  RETURNED:"Zurück", COMPLETED:"Abgeschlossen", CANCELLED:"Storniert",
};

const TABS = [
  { value: "", label: "Alle" },
  { value: "PENDING", label: "Offen" },
  { value: "CONFIRMED", label: "Bestätigt" },
  { value: "DISPATCHED", label: "Unterwegs" },
  { value: "RETURN_INITIATED", label: "Rückgabe" },
  { value: "COMPLETED", label: "Fertig" },
  { value: "CANCELLED", label: "Storniert" },
];

interface Props { searchParams: { status?: string } }

export default async function AdminBookingsPage({ searchParams }: Props) {
  const statusFilter = searchParams.status ?? "";

  const bookings = await prisma.booking.findMany({
    ...(statusFilter ? { where: { status: statusFilter as BookingStatus } } : {}),
    include: {
      renter: { select: { name: true, email: true, company: true } },
      product: {
        select: { name: true, images: true, vendor: { select: { name: true, company: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Buchungen</h1>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          {bookings.length} Ergebnisse
        </span>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/bookings?status=${tab.value}` : "/admin/bookings"}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table — scrolls horizontally on mobile */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                {["Produkt / Vermieter", "Mieter", "Zeitraum", "Betrag", "Status", "Aktionen"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Keine Buchungen gefunden.
                  </td>
                </tr>
              ) : bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.product.images[0] ? (
                        <img src={b.product.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">🏗️</div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{b.product.name}</p>
                        <p className="text-xs text-gray-400">{b.product.vendor.company ?? b.product.vendor.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">{b.renter.name}</p>
                    <p className="text-xs text-gray-400">{b.renter.company ?? b.renter.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    <p>{formatDate(b.startDate)}</p>
                    <p className="text-xs text-gray-400">bis {formatDate(b.endDate)}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-semibold text-gray-900">{formatCurrency(Number(b.totalPrice))}</p>
                    {Number(b.depositAmount) > 0 && (
                      <p className="text-xs text-gray-400">Anz. {formatCurrency(Number(b.depositAmount))}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={bookingStatusVariant(b.status)}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Link>
                      <AdminBookingActions bookingId={b.id} currentStatus={b.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
