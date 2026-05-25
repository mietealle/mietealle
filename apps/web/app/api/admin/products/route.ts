import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireRole("ADMIN");

  const products = await prisma.product.findMany({
    include: {
      vendor: { select: { id: true, name: true, company: true, verificationStatus: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function DELETE(req: Request) {
  await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID fehlt." }, { status: 400 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
