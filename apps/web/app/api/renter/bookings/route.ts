import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRentalDays } from "@/lib/utils";
import { createNotification, createAuditLog } from "@/lib/notifications";

export async function GET() {
  const session = await requireRole("RENTER");
  const bookings = await prisma.booking.findMany({
    where: { renterId: session.user.id },
    include: {
      product: {
        select: {
          name: true, slug: true, images: true,
          vendor: { select: { id: true, name: true, company: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookings);
}

interface CreateBookingBody {
  productId: string;
  startDate: string;
  endDate: string;
  quantity?: number;
  transportIncluded?: boolean;
  deliveryAddress?: string | null;
  insuranceIncluded?: boolean;
  notes?: string | null;
}

export async function POST(req: Request) {
  const session = await requireRole("RENTER");
  const body = await req.json() as CreateBookingBody;
  const {
    productId, startDate, endDate,
    quantity = 1,
    transportIncluded = false,
    deliveryAddress = null,
    insuranceIncluded = false,
    notes = null,
  } = body;

  const product = await prisma.product.findUnique({
    where: { id: productId, availability: true },
    include: { vendor: { select: { id: true, name: true } } },
  });
  if (!product) return NextResponse.json({ error: "Produkt nicht verfügbar." }, { status: 404 });

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (end <= start) return NextResponse.json({ error: "Enddatum muss nach Startdatum liegen." }, { status: 400 });

  if (transportIncluded && !deliveryAddress?.trim()) {
    return NextResponse.json({ error: "Lieferadresse ist erforderlich, wenn Transport gewählt wird." }, { status: 400 });
  }

  const days = calculateRentalDays(start, end);

  // Availability check
  const overlapping = await prisma.booking.aggregate({
    where: {
      productId,
      status: { notIn: ["CANCELLED", "COMPLETED", "RETURNED"] },
      startDate: { lte: end },
      endDate:   { gte: start },
    },
    _sum: { quantity: true },
  });
  if ((overlapping._sum.quantity ?? 0) + quantity > product.quantity) {
    return NextResponse.json({ error: "Produkt ist für diesen Zeitraum nicht verfügbar." }, { status: 409 });
  }

  const rentalTotal   = Number(product.pricePerDay) * days * quantity;
  const transportCost = transportIncluded && product.transportAvailable ? Number(product.transportCost ?? 0) : 0;
  const insuranceCost = insuranceIncluded && product.insuranceAvailable ? Number(product.insuranceCostPerDay ?? 0) * days * quantity : 0;
  const totalPrice    = rentalTotal + transportCost + insuranceCost;
  const depositAmount = Number(product.pricePerDay) * Math.min(5, days) * quantity;

  const booking = await prisma.booking.create({
    data: {
      renterId: session.user.id, productId,
      startDate: start, endDate: end, quantity,
      totalPrice, transportIncluded, transportCost,
      deliveryAddress: deliveryAddress ?? null,
      insuranceIncluded, insuranceCost,
      depositAmount, notes,
    },
  });

  await createNotification({
    userId: product.vendor.id,
    type: "BOOKING_CREATED",
    title: "🔔 Neue Buchungsanfrage",
    message: `${session.user.name ?? "Ein Mieter"} möchte "${product.name}" vom ${start.toLocaleDateString("de-DE")} bis ${end.toLocaleDateString("de-DE")} mieten.`,
    entityId: booking.id,
  });

  await createAuditLog({ userId: session.user.id, action: "BOOKING_CREATED", entity: "Booking", entityId: booking.id, details: { productId, startDate, endDate, totalPrice } });

  return NextResponse.json(booking, { status: 201 });
}
