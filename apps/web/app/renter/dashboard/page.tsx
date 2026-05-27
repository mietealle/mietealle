import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, bookingStatusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BookingCalendar } from "@/components/ui/booking-calendar";
import { CalendarCheck } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function RenterDashboard() {
  const session = await getSession();
  const renterId = session!.user.id;

  const [bookings, total, active] = await Promise.all([
    prisma.booking.findMany({
      where: { renterId },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.booking.count({ where: { renterId } }),
    prisma.booking.count({ where: { renterId, status: { in: ["ACTIVE", "CONFIRMED", "DISPATCHED", "DELIVERED"] } } }),
  ]);

  // All bookings for calendar (not just last 5)
  const allBookings = await prisma.booking.findMany({
    where: { renterId, status: { not: "CANCELLED" } },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      product: { select: { name: true } },
    },
  });

  const calendarBookings = allBookings.map((b) => ({
    id: b.id,
    label: b.product.name,
    startDate: b.startDate,
    endDate: b.endDate,
    status: b.status,
  }));

  const STATUS_LABEL: Record<string, string> = {
    PENDING: "Anfrage", CONFIRMED: "Bestätigt", ACTIVE: "Aktiv",
    DISPATCHED: "Versendet", DELIVERED: "Geliefert",
    RETURN_INITIATED: "Rückgabe", COMPLETED: "Abgeschlossen", CANCELLED: "Storniert",
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Willkommen, {session!.user.name}
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-500">Buchungen gesamt</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-500">Aktive Mieten</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{active}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent bookings */}
        <div>
          <h2 className="mb-3 font-semibold text-gray-700">Letzte Buchungen</h2>
          <div className="grid gap-3">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-gray-900">{b.product.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(b.startDate)} – {formatDate(b.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{formatCurrency(Number(b.totalPrice))}</p>
                    <Badge variant={bookingStatusVariant(b.status)}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {bookings.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  Noch keine Buchungen.
                </CardContent>
              </Card>
            )}
            {bookings.length > 0 && (
              <div className="text-right">
                <Link href="/renter/bookings" className="text-xs text-brand-600 hover:underline">
                  Alle Buchungen ansehen →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Booking calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" /> Buchungskalender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BookingCalendar bookings={calendarBookings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
