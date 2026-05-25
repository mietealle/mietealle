import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BookingStatus } from "@mietealle/db";

export async function GET() {
  const session = await requireRole("VENDOR");

  const bookings = await prisma.booking.findMany({
    where: { product: { vendorId: session.user.id } },
    include: {
      product: { select: { id: true, name: true, slug: true } },
      renter: { select: { id: true, name: true, email: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

interface UpdateStatusBody {
  bookingId: string;
  status: BookingStatus;
}

export async function PATCH(req: Request) {
  const session = await requireRole("VENDOR");
  const body = await req.json() as UpdateStatusBody;
  const { bookingId, status } = body;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, product: { vendorId: session.user.id } },
  });

  if (!booking) {
    return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  return NextResponse.json(updated);
}
