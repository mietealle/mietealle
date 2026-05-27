import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, bookingStatusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { VendorDispatchActions } from "@/components/vendor/dispatch-actions";
import {
  ArrowLeft, User, Package, MapPin, Truck, Shield, Calendar, CreditCard,
} from "lucide-react";

export const metadata: Metadata = { title: "Buchungsdetails" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Anfrage eingegangen",
  CONFIRMED: "Bestätigt",
  ACTIVE: "Aktiv",
  DISPATCHED: "Versendet",
  DELIVERED: "Geliefert",
  RETURN_INITIATED: "Rückgabe angefragt",
  RETURN_DISPATCHED: "Rückversand",
  RETURNED: "Zurückgegeben",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
};

const TIMELINE = [
  { key: "PENDING",          label: "Anfrage eingegangen", tsField: "createdAt" },
  { key: "CONFIRMED",        label: "Bestätigt",            tsField: "confirmedAt" },
  { key: "DISPATCHED",       label: "Versendet",            tsField: "dispatchedAt" },
  { key: "DELIVERED",        label: "Geliefert",            tsField: "deliveredAt" },
  { key: "RETURN_INITIATED", label: "Rückgabe angefragt",   tsField: "returnInitiatedAt" },
  { key: "RETURNED",         label: "Zurückgegeben",        tsField: "returnedAt" },
  { key: "COMPLETED",        label: "Abgeschlossen",        tsField: "completedAt" },
] as const;

export default async function VendorBookingDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const booking = await prisma.booking.findFirst({
    where: { id: params.id, product: { vendorId: session!.user.id } },
    include: {
      renter: { select: { id: true, name: true, email: true, company: true, phone: true } },
      product: { select: { id: true, name: true, images: true, category: true } },
    },
  });
  if (!booking) notFound();

  const rentalDays = Math.max(
    1,
    Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86_400_000)
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back + header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/vendor/bookings"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          Buchung #{booking.id.slice(-8).toUpperCase()}
        </h1>
        <Badge variant={bookingStatusVariant(booking.status)}>
          {STATUS_LABEL[booking.status] ?? booking.status}
        </Badge>
      </div>

      {/* Dispatch actions at the top for quick access */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Verfügbare Aktionen
          </p>
          <VendorDispatchActions
            bookingId={booking.id}
            currentStatus={booking.dispatchStatus}
            bookingStatus={booking.status}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timeline */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Statusverlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-3.5 top-0 h-full w-px bg-gray-200" />
              <ol className="space-y-4">
                {TIMELINE.map((step, i) => {
                  const tsValue = (booking as Record<string, unknown>)[step.tsField] as Date | null;
                  const reached = tsValue !== null && tsValue !== undefined;
                  const isCurrent = booking.status === step.key;
                  return (
                    <li key={step.key} className="flex items-start gap-4 pl-1">
                      <div
                        className={[
                          "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                          reached
                            ? "border-brand-600 bg-brand-600 text-white"
                            : isCurrent
                            ? "border-brand-400 bg-white"
                            : "border-gray-300 bg-white",
                        ].join(" ")}
                      >
                        {reached ? (
                          <span className="text-xs font-bold">{i + 1}</span>
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className={`text-sm font-medium ${reached ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        {reached && tsValue && (
                          <p className="text-xs text-gray-400">
                            {new Date(tsValue).toLocaleString("de-DE")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Renter info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" /> Mieter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium text-gray-900">{booking.renter.name}</p>
            {booking.renter.company && <p className="text-gray-500">{booking.renter.company}</p>}
            <p className="text-gray-500">{booking.renter.email}</p>
            {booking.renter.phone && <p className="text-gray-500">{booking.renter.phone}</p>}
            {booking.deliveryAddress && (
              <div className="flex items-start gap-1 rounded-lg bg-gray-50 p-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <p className="text-gray-600">{booking.deliveryAddress}</p>
              </div>
            )}
            {booking.notes && (
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="text-xs font-medium text-gray-500">Anmerkung</p>
                <p className="text-gray-600 italic">"{booking.notes}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Produkt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              {booking.product.images[0] ? (
                <img
                  src={booking.product.images[0]}
                  alt={booking.product.name}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                  🏗️
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">{booking.product.name}</p>
                <p className="text-xs text-gray-400">{booking.product.category}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Mietdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Mietbeginn</span>
              <span className="font-medium">{formatDate(booking.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mietende</span>
              <span className="font-medium">{formatDate(booking.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dauer</span>
              <span className="font-medium">
                {rentalDays} Tag{rentalDays !== 1 ? "e" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Stückzahl</span>
              <span className="font-medium">{booking.quantity}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pricing breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Kostenaufschlüsselung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Miete ({rentalDays} Tage × {booking.quantity} Stk.)</span>
              <span>
                {formatCurrency(
                  Number(booking.totalPrice) -
                    Number(booking.transportCost) -
                    Number(booking.insuranceCost)
                )}
              </span>
            </div>
            {booking.transportIncluded && (
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Transport
                </span>
                <span>{formatCurrency(Number(booking.transportCost))}</span>
              </div>
            )}
            {booking.insuranceIncluded && (
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Versicherung
                </span>
                <span>{formatCurrency(Number(booking.insuranceCost))}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold text-gray-900">
              <span>Gesamtbetrag</span>
              <span>{formatCurrency(Number(booking.totalPrice))}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Anzahlung</span>
              <span>{formatCurrency(Number(booking.depositAmount))}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Zahlungsstatus</span>
              <span className={booking.depositPaid ? "font-medium text-green-600" : "text-yellow-600"}>
                {booking.depositPaid ? "Anzahlung erhalten" : "Ausstehend"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
