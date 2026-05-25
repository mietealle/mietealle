import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge, verificationVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Produktverwaltung" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      vendor: { select: { name: true, company: true, verificationStatus: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Produkte</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Produkt", "Anbieter", "Kategorie", "Preis/Tag", "Buchungen", "Erstellt"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] && (
                        <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{p.vendor.company ?? p.vendor.name}</p>
                    <Badge variant={verificationVariant(p.vendor.verificationStatus)} className="mt-1">
                      {p.vendor.verificationStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(Number(p.pricePerDay))}</td>
                  <td className="px-4 py-3 text-gray-600">{p._count.bookings}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
