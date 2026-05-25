import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Category } from "@mietealle/db";

export async function GET(req: Request) {
  await requireRole("RENTER");

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as Category | null;
  const q = searchParams.get("q");

  const products = await prisma.product.findMany({
    where: {
      availability: true,
      vendor: { verificationStatus: "APPROVED" },
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      vendor: { select: { id: true, name: true, company: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(products);
}
