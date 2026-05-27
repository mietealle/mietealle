import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, bookingStatusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReturnActions } from "@/components/renter/return-actions";
import { CheckCircle2, Circle, Truck, Package, RotateCcw } from "lucide-react";

export const metadata: Metadata = { title: "Meine Buchungen" };

const STATUS_LABEL: Record<string, string> = {
  PENDING:"Anfrage gesendet", CONFIRMED:"Bestätigt", ACTIVE:"Aktiv",
  DISPATCHED:"Versendet", DELIVERED:"Geliefert", RETURN_INITIATED:"Rückgabe angefragt",
  RETURN_DISPATCHED:"Rückversand", RETURNED:"Zurückgegeben", COMPLETED:"Abgeschlossen", CANCELLED:"Storniert",
};

const STATUS_STEPS = ["PENDING","CONFIRMED","DISPATCHED","DELIVERED","RETURNED","COMPLETED"];

export default async function RenterBookingsPage() {
  const session = await getSession();
  const bookings = await prisma.booking.findMany({
    where: { renterId: session!.user.id },
    include: {
      product: { select: { name: true, images: true, vendor: { select: { name: true, company: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Meine Buchungen</h1>
      {bookings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">Noch keine Buchungen.</CardContent></Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((b) => {
            const currentStep = STATUS_STEPS.indexOf(b.status);
            return (
              <Card key={b.id}>
                <CardContent className="py-4">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    {b.product.images[0] ? (
                      <img src={b.product.images[0]} alt={b.product.name} className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-2xl">🏗️</div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{b.product.name}</p>
                        <Badge variant={bookingStatusVariant(b.status)}>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{b.product.vendor.company ?? b.product.vendor.name}</p>
                      <p className="text-sm text-gray-400">{formatDate(b.startDate)} – {formatDate(b.endDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(Number(b.totalPrice))}</p>
                      {Number(b.transportCost) > 0 && <p className="text-xs text-gray-400">inkl. Transport</p>}
                      {Number(b.insuranceCost) > 0 && <p className="text-xs text-gray-400">inkl. Versicherung</p>}
                    </div>
                  </div>

                  {/* Progress stepper */}
                  {b.status !== "CANCELLED" && (
                    <div className="mt-4 flex items-center gap-0">
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= currentStep;
                        const icons: Record<string, React.ReactNode> = {
                          PENDING: <Circle className="h-4 w-4" />,
                          CONFIRMED: <CheckCircle2 className="h-4 w-4" />,
                          DISPATCHED: <Truck className="h-4 w-4" />,
                          DELIVERED: <Package className="h-4 w-4" />,
                          RETURNED: <RotateCcw className="h-4 w-4" />,
                          COMPLETED: <CheckCircle2 className="h-4 w-4" />,
                        };
                        return (
                          <div key={step} className="flex flex-1 items-center">
                            <div className={`flex flex-col items-center gap-1 ${done ? "text-brand-600" : "text-gray-300"}`}>
                              {icons[step]}
                              <span className="text-[10px] font-medium">{STATUS_LABEL[step]?.split(" ")[0]}</span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`h-px flex-1 ${i < currentStep ? "bg-brand-400" : "bg-gray-200"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Return action */}
                  {(b.status === "DELIVERED" || b.status === "ACTIVE") && (
                    <div className="mt-3">
                      <ReturnActions bookingId={b.id} hasTransport={b.transportIncluded} />
                    </div>
                  )}

                  {/* Detail link */}
                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/renter/bookings/${b.id}`}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Details ansehen →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
