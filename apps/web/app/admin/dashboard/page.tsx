import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, bookingStatusVariant, verificationVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Users, Package, CalendarCheck, TrendingUp, AlertTriangle, BadgeDollarSign } from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const [
    userCount,
    productCount,
    bookingCount,
    pendingVendors,
    revenueResult,
    completedBookingsWithCommission,
    recentBookings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.booking.count(),
    prisma.user.findMany({
      where: { role: "VENDOR", verificationStatus: "PENDING" },
      select: { id: true, name: true, company: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { totalPrice: true } }),
    // Fetch completed bookings with vendor commission rate to calculate earned commission
    prisma.booking.findMany({
      where: { status: "COMPLETED" },
      select: {
        totalPrice: true,
        product: { select: { vendor: { select: { commissionRate: true } } } },
      },
    }),
    prisma.booking.findMany({
      where: { status: { in: ["RETURN_INITIATED", "DISPATCHED", "PENDING"] } },
      include: {
        product: { select: { name: true } },
        renter: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const totalRevenue = Number(revenueResult._sum.totalPrice ?? 0);
  const totalCommission = completedBookingsWithCommission.reduce(
    (sum, b) => sum + Number(b.totalPrice) * (b.product.vendor.commissionRate / 100),
    0
  );

  const stats = [
    { title: "Nutzer gesamt",     value: userCount,                       Icon: Users,            color: "text-blue-600",   bg: "bg-blue-50" },
    { title: "Produkte",          value: productCount,                    Icon: Package,          color: "text-green-600",  bg: "bg-green-50" },
    { title: "Buchungen",         value: bookingCount,                    Icon: CalendarCheck,    color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Plattformumsatz",   value: formatCurrency(totalRevenue),    Icon: TrendingUp,       color: "text-brand-600",  bg: "bg-brand-50" },
    { title: "Provisionseinnahmen", value: formatCurrency(totalCommission), Icon: BadgeDollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* KPI cards — 5 cards: 2 rows on mobile, all in one row on xl */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        {stats.map(({ title, value, Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{title}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending verifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Ausstehende Genehmigungen
              </CardTitle>
              <Link href="/admin/users" className="text-xs text-brand-600 hover:underline">
                Alle anzeigen →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingVendors.length === 0 ? (
              <p className="text-sm text-gray-400">Keine ausstehenden Genehmigungen.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingVendors.map((v) => (
                  <Link
                    key={v.id}
                    href={`/admin/users`}
                    className="flex items-center justify-between rounded-lg bg-yellow-50 p-3 hover:bg-yellow-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.name}</p>
                      <p className="text-xs text-gray-500">{v.company ?? v.email}</p>
                      <p className="text-xs text-gray-400">{formatDate(v.createdAt)}</p>
                    </div>
                    <Badge variant="warning">PENDING</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings needing attention */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Buchungen im Fokus</CardTitle>
              <Link href="/admin/bookings" className="text-xs text-brand-600 hover:underline">
                Alle →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-gray-400">Keine offenen Aktionen.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentBookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.product.name}</p>
                      <p className="text-xs text-gray-500">{b.renter.name} · {formatDate(b.startDate)}</p>
                    </div>
                    <Badge variant={bookingStatusVariant(b.status)}>{b.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
