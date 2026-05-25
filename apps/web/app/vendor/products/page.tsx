import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Meine Maschinen" };

export default async function VendorProductsPage() {
  const session = await getSession();
  const products = await prisma.product.findMany({
    where: { vendorId: session!.user.id },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meine Maschinen</h1>
        <Link href="/vendor/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Maschine hinzufügen
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            Noch keine Maschinen. Fügen Sie Ihre erste Maschine hinzu.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 py-4">
                {p.images[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{p.name}</h3>
                    <Badge variant={p.availability ? "success" : "danger"}>
                      {p.availability ? "Verfügbar" : "Nicht verfügbar"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{p.category} · {p.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(Number(p.pricePerDay))}/Tag</p>
                  <p className="text-sm text-gray-400">{p._count.bookings} Buchungen</p>
                </div>
                <Link href={`/vendor/products/${p.id}`}>
                  <Button variant="secondary" size="sm">Bearbeiten</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
