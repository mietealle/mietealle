import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/notifications";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole("VENDOR");
  const product = await prisma.product.findFirst({
    where: { id: params.id, vendorId: session.user.id },
  });
  if (!product) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole("VENDOR");
  const body = await req.json() as Record<string, unknown>;
  const product = await prisma.product.findFirst({ where: { id: params.id, vendorId: session.user.id } });
  if (!product) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  // Build update data — only include fields that are actually present in the request body
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string")           data.name = body.name;
  if (typeof body.description === "string")    data.description = body.description;
  if (body.category !== undefined)             data.category = body.category;
  if (typeof body.pricePerDay === "number")    data.pricePerDay = body.pricePerDay;
  if (Array.isArray(body.images))              data.images = body.images;
  if (typeof body.location === "string")       data.location = body.location;
  if (typeof body.availability === "boolean")  data.availability = body.availability;
  if (typeof body.quantity === "number")       data.quantity = body.quantity;
  if (typeof body.transportAvailable === "boolean") data.transportAvailable = body.transportAvailable;
  if ("transportCost" in body)                 data.transportCost = body.transportCost as number | null;
  if (typeof body.insuranceAvailable === "boolean") data.insuranceAvailable = body.insuranceAvailable;
  if ("insuranceCostPerDay" in body)           data.insuranceCostPerDay = body.insuranceCostPerDay as number | null;

  const updated = await prisma.product.update({
    where: { id: params.id },
    data,
  });

  await createAuditLog({ userId: session.user.id, action: "PRODUCT_UPDATED", entity: "Product", entityId: params.id });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole("VENDOR");
  const product = await prisma.product.findFirst({ where: { id: params.id, vendorId: session.user.id } });
  if (!product) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  await prisma.product.delete({ where: { id: params.id } });
  await createAuditLog({ userId: session.user.id, action: "PRODUCT_DELETED", entity: "Product", entityId: params.id });
  return NextResponse.json({ ok: true });
}
