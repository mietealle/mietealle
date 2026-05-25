import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Maschinen suchen" };

interface SearchParams {
  q?: string;
  category?: string;
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const products = await prisma.product.findMany({
    where: {
      availability: true,
      vendor: { verificationStatus: "APPROVED" },
      ...(searchParams.category ? { category: searchParams.category as never } : {}),
      ...(searchParams.q
        ? {
            OR: [
              { name: { contains: searchParams.q, mode: "insensitive" } },
              { description: { contains: searchParams.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      vendor: { select: { name: true, company: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Maschinen suchen</h1>

      {/* Search bar */}
      <form className="mb-6 flex gap-3">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Bagger, Kran, Generator..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Suchen
        </button>
      </form>

      {products.length === 0 ? (
        <p className="text-center text-gray-400">Keine Maschinen gefunden.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/renter/browse/${p.slug}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                {p.images[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-48 w-full rounded-t-xl object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-t-xl bg-gray-100 text-4xl">
                    🏗️
                  </div>
                )}
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{p.name}</h3>
                      <p className="text-sm text-gray-400">
                        {p.vendor.company ?? p.vendor.name}
                      </p>
                    </div>
                    <Badge variant="info">{p.category}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-semibold text-brand-700">
                      {formatCurrency(Number(p.pricePerDay))}/Tag
                    </p>
                    <p className="text-xs text-gray-400">{p._count.reviews} Bewertungen</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
