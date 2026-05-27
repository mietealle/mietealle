import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, bookingStatusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { VendorDispatchActions } from "@/components/vendor/dispatch-actions";

export const metadata: Metadata = { title: "Buchungen" };

const STATUS_LABEL: Record<string, string> = {
  PENDING:"Anfrage",CONFIRMED:"Bestätigt",ACTIVE:"Aktiv",DISPATCHED:"Versendet",
  DELIVERED:"Geliefert",RETURN_INITIATED:"Rückgabe angefragt",RETURN_DISPATCHED:"Rückversand",
  RETURNED:"Zurückgegeben",COMPLETED:"Abgeschlossen",CANCELLED:"Storniert",
};

export default async function VendorBookingsPage() {
  const session = await getSession();
  const bookings = await prisma.booking.findMany({
    where: { product: { vendorId: session!.user.id } },
    include: {
      product: { select: { name: true } },
      renter: { select: { name: true, email: true, company: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Buchungen</h1>
      {bookings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">Noch keine Buchungen.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{b.product.name}</p>
                      <Badge variant={bookingStatusVariant(b.status)}>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {b.renter.company ?? b.renter.name} · {b.renter.email}
                      {b.renter.phone && ` · ${b.renter.phone}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(b.startDate)} – {formatDate(b.endDate)}
                      {b.transportIncluded && " · Transport inkl."}
                      {b.insuranceIncluded && " · Versicherung inkl."}
                    </p>
                    {b.notes && <p className="mt-1 text-sm italic text-gray-400">"{b.notes}"</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(Number(b.totalPrice))}</p>
                    {Number(b.transportCost) > 0 && <p className="text-xs text-gray-400">+ {formatCurrency(Number(b.transportCost))} Transport</p>}
                    {Number(b.insuranceCost) > 0 && <p className="text-xs text-gray-400">+ {formatCurrency(Number(b.insuranceCost))} Versicherung</p>}
                    <p className="mt-1 text-xs text-gray-400">Anzahlung: {formatCurrency(Number(b.depositAmount))}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <VendorDispatchActions bookingId={b.id} currentStatus={b.dispatchStatus} bookingStatus={b.status} />
                  <Link
                    href={`/vendor/bookings/${b.id}`}
                    className="shrink-0 text-xs text-brand-600 hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
