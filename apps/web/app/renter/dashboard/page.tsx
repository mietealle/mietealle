import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, bookingStatusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function RenterDashboard() {
  const session = await getSession();
  const renterId = session!.user.id;

  const bookings = await prisma.booking.findMany({
    where: { renterId },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const total = await prisma.booking.count({ where: { renterId } });
  const active = await prisma.booking.count({ where: { renterId, status: "ACTIVE" } });

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
                <Badge variant={bookingStatusVariant(b.status)}>{b.status}</Badge>
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
      </div>
    </div>
  );
}
