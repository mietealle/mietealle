import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, createAuditLog } from "@/lib/notifications";
import type { BookingStatus } from "@mietealle/db";

export async function GET() {
  const session = await requireRoleForApi("VENDOR");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

const STATUS_NOTIFICATIONS: Partial<Record<BookingStatus, { title: string; message: string }>> = {
  CONFIRMED: {
    title: "Buchung bestätigt",
    message: "Gute Nachrichten! Ihre Buchung wurde vom Vermieter bestätigt.",
  },
  CANCELLED: {
    title: "Buchung abgelehnt",
    message: "Ihre Buchungsanfrage wurde vom Vermieter abgelehnt.",
  },
};

export async function PATCH(req: Request) {
  const session = await requireRoleForApi("VENDOR");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as UpdateStatusBody;
  const { bookingId, status } = body;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, product: { vendorId: session.user.id } },
    select: { id: true, renterId: true, status: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });
  }

  const timestamps: Record<string, Date> = {};
  if (status === "CONFIRMED") timestamps.confirmedAt = new Date();

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status, ...timestamps },
  });

  // Notify renter on confirm or cancel
  const notif = STATUS_NOTIFICATIONS[status];
  if (notif) {
    await createNotification({
      userId: booking.renterId,
      type: `BOOKING_${status}`,
      title: notif.title,
      message: notif.message,
      entityId: bookingId,
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: `BOOKING_${status}`,
    entity: "Booking",
    entityId: bookingId,
    details: { status },
  });

  return NextResponse.json(updated);
}
