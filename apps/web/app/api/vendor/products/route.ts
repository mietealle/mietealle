import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { createAuditLog } from "@/lib/notifications";
import type { Category } from "@mietealle/db";

export async function GET() {
  const session = await requireRole("VENDOR");
  const products = await prisma.product.findMany({
    where: { vendorId: session.user.id },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

interface CreateProductBody {
  name: string;
  description: string;
  category: Category;
  pricePerDay: number;
  images: string[];
  location?: string;
  quantity?: number;
  transportAvailable?: boolean;
  transportCost?: number;
  insuranceAvailable?: boolean;
  insuranceCostPerDay?: number;
}

export async function POST(req: Request) {
  const session = await requireRole("VENDOR");
  const body = await req.json() as CreateProductBody;

  const baseSlug = slugify(body.name);
  const existing = await prisma.product.count({ where: { slug: { startsWith: baseSlug } } });
  const slug = existing > 0 ? `${baseSlug}-${existing}` : baseSlug;

  const product = await prisma.product.create({
    data: {
      vendorId: session.user.id,
      name: body.name,
      slug,
      description: body.description,
      category: body.category,
      pricePerDay: body.pricePerDay,
      images: body.images,
      location: body.location ?? null,
      quantity: body.quantity ?? 1,
      transportAvailable: body.transportAvailable ?? false,
      transportCost: body.transportCost ?? null,
      insuranceAvailable: body.insuranceAvailable ?? false,
      insuranceCostPerDay: body.insuranceCostPerDay ?? null,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    details: { name: product.name },
  });

  return NextResponse.json(product, { status: 201 });
}
