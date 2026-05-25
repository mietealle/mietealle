import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, createNotification } from "@/lib/notifications";
import type { BookingStatus } from "@mietealle/db";

export async function GET(req: Request) {
  await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as BookingStatus | null;
  const id = searchParams.get("id");

  // Single booking detail
  if (id) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        renter: { select: { id: true, name: true, email: true, company: true, phone: true } },
        product: {
          include: {
            vendor: { select: { id: true, name: true, email: true, company: true, phone: true } },
          },
        },
        invoices: true,
      },
    });
    if (!booking) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    return NextResponse.json(booking);
  }

  // List
  const bookings = await prisma.booking.findMany({
    ...(status ? { where: { status } } : {}),
    include: {
      renter: { select: { name: true, email: true, company: true } },
      product: {
        select: {
          name: true, images: true,
          vendor: { select: { name: true, company: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookings);
}

interface PatchBody {
  bookingId: string;
  status: BookingStatus;
}

export async function PATCH(req: Request) {
  const session = await requireRole("ADMIN");
  const body = await req.json() as PatchBody;

  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    select: { renterId: true, product: { select: { vendorId: true, name: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const timestamps: Record<string, Date> = {};
  if (body.status === "CONFIRMED") timestamps.confirmedAt = new Date();
  if (body.status === "COMPLETED") timestamps.completedAt = new Date();

  const updated = await prisma.booking.update({
    where: { id: body.bookingId },
    data: { status: body.status, ...timestamps },
  });

  // Notify renter and vendor
  const statusMsg: Record<string, string> = {
    CONFIRMED: "Ihre Buchung wurde von der Plattform bestätigt.",
    CANCELLED: "Ihre Buchung wurde storniert.",
    COMPLETED: "Ihre Buchung wurde als abgeschlossen markiert.",
  };
  const msg = statusMsg[body.status];
  if (msg) {
    await createNotification({ userId: booking.renterId, type: `ADMIN_${body.status}`, title: `Buchung ${body.status}`, message: msg, entityId: body.bookingId });
    await createNotification({ userId: booking.product.vendorId, type: `ADMIN_${body.status}`, title: `Buchung ${body.status}`, message: `Admin hat Buchung für "${booking.product.name}" auf ${body.status} gesetzt.`, entityId: body.bookingId });
  }

  await createAuditLog({ userId: session.user.id, action: `BOOKING_${body.status}`, entity: "Booking", entityId: body.bookingId });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt." }, { status: 400 });

  await prisma.booking.delete({ where: { id } });
  await createAuditLog({ userId: session.user.id, action: "BOOKING_DELETED", entity: "Booking", entityId: id });
  return NextResponse.json({ ok: true });
}
