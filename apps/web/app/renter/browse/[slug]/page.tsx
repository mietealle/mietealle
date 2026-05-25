import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookingForm } from "@/components/renter/booking-form";
import { MapPin, Package, Truck, Shield, Star } from "lucide-react";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, select: { name: true } });
  return { title: product?.name ?? "Produkt" };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, availability: true },
    include: {
      vendor: { select: { id: true, name: true, company: true, verificationStatus: true } },
      _count: { select: { reviews: true } },
      reviews: { select: { rating: true, body: true, author: { select: { name: true } } }, take: 5, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) notFound();

  // Fetch booked date ranges to show on calendar
  const bookings = await prisma.booking.findMany({
    where: { productId: product.id, status: { notIn: ["CANCELLED", "COMPLETED", "RETURNED"] } },
    select: { startDate: true, endDate: true },
  });
  const bookedRanges = bookings.map((b) => ({
    start: b.startDate.toISOString().split("T")[0]!,
    end: b.endDate.toISOString().split("T")[0]!,
  }));

  const avgRating = product.reviews.length > 0
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: product info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Gallery */}
          {product.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <img src={product.images[0]} alt={product.name} className="col-span-2 h-64 w-full rounded-xl object-cover" />
              {product.images.slice(1, 3).map((img, i) => (
                <img key={i} src={img} alt="" className="h-32 w-full rounded-xl object-cover" />
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-6xl">🏗️</div>
          )}

          <Card>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                  <div className="mt-1 flex items-center gap-3">
                    <Badge variant="info">{product.category}</Badge>
                    {product.location && (
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <MapPin className="h-3 w-3" />{product.location}
                      </span>
                    )}
                    {avgRating && (
                      <span className="flex items-center gap-1 text-sm text-yellow-600">
                        <Star className="h-3 w-3 fill-current" />{avgRating} ({product._count.reviews})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-700">{formatCurrency(Number(product.pricePerDay))}</p>
                  <p className="text-xs text-gray-400">pro Tag</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-600 leading-relaxed">{product.description}</p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Package className="h-4 w-4" />{product.quantity} verfügbar
                </span>
                {product.transportAvailable && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Truck className="h-4 w-4" />Transport: {formatCurrency(Number(product.transportCost))}
                  </span>
                )}
                {product.insuranceAvailable && (
                  <span className="flex items-center gap-1 text-sm text-blue-600">
                    <Shield className="h-4 w-4" />Versicherung: {formatCurrency(Number(product.insuranceCostPerDay))}/Tag
                  </span>
                )}
              </div>

              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-gray-500">Anbieter: <span className="font-medium text-gray-700">{product.vendor.company ?? product.vendor.name}</span></p>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          {product.reviews.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <h3 className="mb-3 font-semibold">Bewertungen</h3>
                <div className="flex flex-col gap-3">
                  {product.reviews.map((r, i) => (
                    <div key={i} className="border-b pb-3 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.author.name}</span>
                        <span className="flex">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      </div>
                      {r.body && <p className="mt-1 text-sm text-gray-500">{r.body}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: booking form */}
        <div>
          <BookingForm
            productId={product.id}
            pricePerDay={Number(product.pricePerDay)}
            quantity={product.quantity}
            transportAvailable={product.transportAvailable}
            transportCost={Number(product.transportCost ?? 0)}
            insuranceAvailable={product.insuranceAvailable}
            insuranceCostPerDay={Number(product.insuranceCostPerDay ?? 0)}
            bookedRanges={bookedRanges}
            renterId={session?.user.id}
          />
        </div>
      </div>
    </div>
  );
}
