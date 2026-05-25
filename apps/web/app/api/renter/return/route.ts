import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, createAuditLog } from "@/lib/notifications";

interface ReturnBody { bookingId: string }

export async function POST(req: Request) {
  const session = await requireRole("RENTER");
  const body = await req.json() as ReturnBody;

  const booking = await prisma.booking.findFirst({
    where: {
      id: body.bookingId,
      renterId: session.user.id,
      status: { in: ["DELIVERED", "ACTIVE"] },
    },
    include: { product: { select: { name: true, vendorId: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden oder nicht rückgabefähig." }, { status: 404 });

  const updated = await prisma.booking.update({
    where: { id: body.bookingId },
    data: {
      status: "RETURN_INITIATED",
      dispatchStatus: "RETURN_INITIATED",
      returnInitiatedAt: new Date(),
    },
  });

  await createNotification({
    userId: booking.product.vendorId,
    type: "RETURN_INITIATED",
    title: "Rückgabe angefragt",
    message: `Mieter hat Rückgabe für "${booking.product.name}" angefragt.`,
    entityId: body.bookingId,
  });

  await createAuditLog({ userId: session.user.id, action: "RETURN_INITIATED", entity: "Booking", entityId: body.bookingId });

  return NextResponse.json(updated);
}
