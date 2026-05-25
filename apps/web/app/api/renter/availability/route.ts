import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  await requireRole("RENTER");
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { quantity: true },
  });
  if (!product) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  // Get all booked date ranges for this product
  const bookedBookings = await prisma.booking.findMany({
    where: {
      productId,
      status: { notIn: ["CANCELLED", "COMPLETED", "RETURNED"] },
    },
    select: { startDate: true, endDate: true, quantity: true },
  });

  const bookedRanges = bookedBookings.map((b) => ({
    startDate: b.startDate.toISOString().split("T")[0],
    endDate: b.endDate.toISOString().split("T")[0],
  }));

  // If a specific range was requested, check availability
  let available = true;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Count overlapping bookings
    const overlapping = await prisma.booking.aggregate({
      where: {
        productId,
        status: { notIn: ["CANCELLED", "COMPLETED", "RETURNED"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      _sum: { quantity: true },
    });

    const bookedQty = overlapping._sum.quantity ?? 0;
    available = bookedQty < product.quantity;
  }

  return NextResponse.json({ available, bookedRanges, totalQuantity: product.quantity });
}
