import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, verificationVariant } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Package, CalendarCheck, Clock } from "lucide-react";
import { BookingCalendar } from "@/components/ui/booking-calendar";

export const metadata: Metadata = { title: "Dashboard" };

export default async function VendorDashboard() {
  const session = await getSession();
  const vendorId = session!.user.id;

  const [vendor, productCount, bookings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: vendorId },
      select: { commissionRate: true, verificationStatus: true, name: true },
    }),
    prisma.product.count({ where: { vendorId } }),
    prisma.booking.findMany({
      where: { product: { vendorId } },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        transportCost: true,
        insuranceCost: true,
        startDate: true,
        endDate: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const commissionRate = vendor?.commissionRate ?? 0;
  const completedBookings = bookings.filter((b) => ["COMPLETED", "RETURNED"].includes(b.status));
  const grossRevenue = completedBookings.reduce((s, b) => s + Number(b.totalPrice), 0);
  const commissionAmount = grossRevenue * (commissionRate / 100);
  const netRevenue = grossRevenue - commissionAmount;
  const activeBookings = bookings.filter((b) =>
    ["ACTIVE", "CONFIRMED", "DISPATCHED", "DELIVERED"].includes(b.status)
  ).length;
  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;

  // Calendar bookings: exclude cancelled
  const calendarBookings = bookings
    .filter((b) => b.status !== "CANCELLED")
    .map((b) => ({
      id: b.id,
      label: b.product.name,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
    }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Willkommen zurück, {vendor?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={verificationVariant(session!.user.verificationStatus)}>
            {session!.user.verificationStatus}
          </Badge>
          {commissionRate > 0 && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {commissionRate}% Provision
            </span>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Maschinen",      value: productCount,           Icon: Package,      color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Offene Anfragen", value: pendingBookings,        Icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Aktive Mieten",   value: activeBookings,         Icon: CalendarCheck, color: "text-green-600", bg: "bg-green-50" },
          { label: "Nettoumsatz",     value: formatCurrency(netRevenue), Icon: TrendingUp, color: "text-brand-600", bg: "bg-brand-50" },
        ].map(({ label, value, Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue breakdown */}
        {grossRevenue > 0 && (
          <Card>
            <CardHeader><CardTitle>Umsatzaufschlüsselung</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bruttoumsatz</span>
                  <span className="font-medium">{formatCurrency(grossRevenue)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Plattform-Provision ({commissionRate}%)</span>
                  <span>- {formatCurrency(commissionAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
                  <span>Nettoumsatz</span>
                  <span>{formatCurrency(netRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking calendar */}
        <Card className={grossRevenue > 0 ? "" : "lg:col-span-2"}>
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
