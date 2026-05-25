import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, createAuditLog } from "@/lib/notifications";
import type { DispatchStatus, BookingStatus } from "@mietealle/db";

const DISPATCH_MESSAGES: Record<string, { title: string; message: string }> = {
  ON_HOLD: { title: "Versand verschoben", message: "Ihre Buchung wurde vom Vermieter vorübergehend zurückgestellt." },
  DISPATCHED: { title: "Maschine versendet", message: "Ihre Maschine wurde versendet und ist auf dem Weg zu Ihnen." },
  DELIVERED: { title: "Maschine angekommen", message: "Ihre Maschine wurde als geliefert markiert." },
  RETURN_DISPATCHED: { title: "Rückversand gestartet", message: "Die Rückholung Ihrer Maschine wurde eingeleitet." },
  RETURNED: { title: "Rückgabe bestätigt", message: "Die Rückgabe Ihrer Maschine wurde bestätigt. Buchung abgeschlossen." },
  CANCELLED: { title: "Buchung storniert", message: "Ihre Buchung wurde vom Vermieter storniert." },
};

const DISPATCH_TO_BOOKING: Partial<Record<DispatchStatus, BookingStatus>> = {
  ON_HOLD: "CONFIRMED",
  DISPATCHED: "DISPATCHED",
  DELIVERED: "DELIVERED",
  RETURN_DISPATCHED: "RETURN_DISPATCHED",
  RETURNED: "RETURNED",
  CANCELLED: "CANCELLED",
};

interface UpdateDispatchBody { bookingId: string; dispatchStatus: DispatchStatus }

export async function PATCH(req: Request) {
  const session = await requireRole("VENDOR");
  const body = await req.json() as UpdateDispatchBody;
  const { bookingId, dispatchStatus } = body;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, product: { vendorId: session.user.id } },
    select: { id: true, renterId: true, status: true },
  });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });

  const now = new Date();
  const timestamps: Record<string, Date> = {};
  if (dispatchStatus === "DISPATCHED") timestamps.dispatchedAt = now;
  if (dispatchStatus === "DELIVERED") timestamps.deliveredAt = now;
  if (dispatchStatus === "RETURNED") timestamps.returnedAt = now;
  if (dispatchStatus === "RETURNED") timestamps.completedAt = now;

  const newBookingStatus = DISPATCH_TO_BOOKING[dispatchStatus];

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      dispatchStatus,
      ...(newBookingStatus ? { status: newBookingStatus } : {}),
      ...timestamps,
    },
  });

  const msg = DISPATCH_MESSAGES[dispatchStatus];
  if (msg) {
    await createNotification({ userId: booking.renterId, type: `DISPATCH_${dispatchStatus}`, title: msg.title, message: msg.message, entityId: bookingId });
  }

  await createAuditLog({ userId: session.user.id, action: `DISPATCH_${dispatchStatus}`, entity: "Booking", entityId: bookingId, details: { dispatchStatus } });

  return NextResponse.json(updated);
}
