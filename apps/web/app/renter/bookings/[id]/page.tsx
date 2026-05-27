import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, bookingStatusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReturnActions } from "@/components/renter/return-actions";
import {
  ArrowLeft, User, Package, MapPin, Truck, Shield, Calendar, CreditCard,
  CheckCircle2, Circle, RotateCcw,
} from "lucide-react";

export const metadata: Metadata = { title: "Buchungsdetails" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Anfrage gesendet",
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

const STATUS_STEPS = ["PENDING", "CONFIRMED", "DISPATCHED", "DELIVERED", "RETURNED", "COMPLETED"];

const STEP_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Circle className="h-5 w-5" />,
  CONFIRMED: <CheckCircle2 className="h-5 w-5" />,
  DISPATCHED: <Truck className="h-5 w-5" />,
  DELIVERED: <Package className="h-5 w-5" />,
  RETURNED: <RotateCcw className="h-5 w-5" />,
  COMPLETED: <CheckCircle2 className="h-5 w-5" />,
};

const STEP_TIMESTAMPS: Record<string, string> = {
  PENDING: "createdAt",
  CONFIRMED: "confirmedAt",
  DISPATCHED: "dispatchedAt",
  DELIVERED: "deliveredAt",
  RETURNED: "returnedAt",
  COMPLETED: "completedAt",
};

export default async function RenterBookingDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const booking = await prisma.booking.findFirst({
    where: { id: params.id, renterId: session!.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          category: true,
          vendor: { select: { id: true, name: true, company: true, email: true, phone: true } },
        },
      },
    },
  });
  if (!booking) notFound();

  const rentalDays = Math.max(
    1,
    Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86_400_000)
  );

  const currentStep = STATUS_STEPS.indexOf(booking.status);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back + header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/renter/bookings"
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

      {/* Progress stepper */}
      {booking.status !== "CANCELLED" && (
        <Card className="mb-6">
          <CardContent className="py-5">
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const tsField = STEP_TIMESTAMPS[step];
                const tsValue = tsField
                  ? (booking as Record<string, unknown>)[tsField] as Date | null
                  : null;
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className={done ? "text-brand-600" : "text-gray-300"}>
                        {STEP_ICONS[step]}
                      </div>
                      <span
                        className={`text-center text-[10px] font-medium leading-tight ${
                          done ? "text-brand-700" : "text-gray-400"
                        }`}
                      >
                        {STATUS_LABEL[step]?.split(" ")[0]}
                      </span>
                      {done && tsValue && (
                        <span className="text-[9px] text-gray-400">
                          {new Date(tsValue).toLocaleDateString("de-DE")}
                        </span>
                      )}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`h-px flex-1 ${i < currentStep ? "bg-brand-400" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Return actions if eligible */}
      {(booking.status === "DELIVERED" || booking.status === "ACTIVE") && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <ReturnActions bookingId={booking.id} hasTransport={booking.transportIncluded} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vendor & product info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Vermieter & Produkt
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
                <p className="font-medium text-gray-900">{booking.product.name}</p>
                <p className="text-xs text-gray-400">{booking.product.category}</p>
              </div>
            </div>
            <hr />
            <p className="font-medium text-gray-900">
              {booking.product.vendor.company ?? booking.product.vendor.name}
            </p>
            <p className="text-gray-500">{booking.product.vendor.email}</p>
            {booking.product.vendor.phone && (
              <p className="text-gray-500">{booking.product.vendor.phone}</p>
            )}
          </CardContent>
        </Card>

        {/* Booking details */}
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

        {/* Pricing breakdown */}
        <Card className="md:col-span-2">
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
