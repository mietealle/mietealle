import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Never throw — return empty payload for unauthenticated / expired sessions
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
