import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, createAuditLog } from "@/lib/notifications";
import type { VerificationStatus, UserStatus } from "@mietealle/db";

export async function GET() {
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true,
      verificationStatus: true, status: true,
      company: true, phone: true, commissionRate: true,
      createdAt: true, suspendedAt: true, deletedAt: true,
      _count: { select: { products: true, bookings: true } },
    },
    orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(users);
}

// ─── PATCH: update any combination of fields ─────────────────────────────────

interface PatchBody {
  userId: string;
  // Approval flow
  verificationStatus?: VerificationStatus;
  commissionRate?: number;
  // Profile edits
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  // Account lifecycle
  status?: UserStatus;
}

export async function PATCH(req: Request) {
  const session = await requireRole("ADMIN");
  const body = await req.json() as PatchBody;
  const { userId, verificationStatus, commissionRate, name, email, company, phone, status } = body;

  // Prevent admin from suspending / deleting themselves
  if (userId === session.user.id && status && status !== "ACTIVE") {
    return NextResponse.json({ error: "Sie können Ihr eigenes Konto nicht sperren." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (verificationStatus !== undefined) data.verificationStatus = verificationStatus;
  if (commissionRate !== undefined) data.commissionRate = commissionRate;
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (company !== undefined) data.company = company ?? null;
  if (phone !== undefined) data.phone = phone ?? null;
  if (status !== undefined) {
    data.status = status;
    data.suspendedAt = status === "SUSPENDED" ? new Date() : null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true, name: true, email: true, role: true,
      verificationStatus: true, status: true,
      commissionRate: true, company: true, phone: true,
    },
  });

  // Notify user of key lifecycle events
  if (verificationStatus === "APPROVED") {
    await createNotification({
      userId,
      type: "ACCOUNT_APPROVED",
      title: "Konto freigegeben",
      message: `Ihr Vermieter-Konto wurde genehmigt (Provision: ${commissionRate ?? 10}%). Sie können jetzt Maschinen einstellen.`,
    });
  } else if (verificationStatus === "REJECTED") {
    await createNotification({
      userId,
      type: "ACCOUNT_REJECTED",
      title: "Konto abgelehnt",
      message: "Ihr Konto wurde leider nicht freigegeben. Bitte kontaktieren Sie den Support.",
    });
  } else if (status === "SUSPENDED") {
    await createNotification({
      userId,
      type: "ACCOUNT_SUSPENDED",
      title: "Konto gesperrt",
      message: "Ihr Konto wurde vorübergehend gesperrt. Bitte kontaktieren Sie den Support.",
    });
  } else if (status === "ACTIVE" && body.status) {
    await createNotification({
      userId,
      type: "ACCOUNT_REACTIVATED",
      title: "Konto reaktiviert",
      message: "Ihr Konto wurde reaktiviert. Willkommen zurück!",
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: status ? `USER_${status}` : verificationStatus ? `USER_${verificationStatus}` : "USER_UPDATED",
    entity: "User",
    entityId: userId,
    details: { verificationStatus, commissionRate, status, name, email },
  });

  return NextResponse.json(user);
}

// ─── DELETE: GDPR right-to-erasure ───────────────────────────────────────────

export async function DELETE(req: Request) {
  const session = await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId fehlt." }, { status: 400 });
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Sie können Ihr eigenes Konto nicht löschen." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { _count: { select: { bookings: true, products: true } } },
  });
  if (!user) return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });

  // GDPR Art. 17 — anonymise PII but keep record skeleton for legal/accounting
  // (bookings & invoices must be retained for 10 years under German law §147 AO)
  await prisma.user.update({
    where: { id: userId },
    data: {
      // Erase all PII
      name: "Gelöschter Nutzer",
      email: `deleted-${userId}@mietealle.invalid`,
      hashedPassword: null,
      image: null,
      company: null,
      phone: null,
      emailVerified: null,
      // Mark as deleted
      status: "DELETED",
      deletedAt: new Date(),
      // Revoke all sessions
    },
  });

  // Invalidate all active sessions
  await prisma.session.deleteMany({ where: { userId } });
  // Remove OAuth accounts (no longer needed)
  await prisma.account.deleteMany({ where: { userId } });

  await createAuditLog({
    userId: session.user.id,
    action: "USER_GDPR_DELETED",
    entity: "User",
    entityId: userId,
    details: { note: "PII anonymised per GDPR Art. 17. Booking/Invoice records retained per §147 AO." },
  });

  return NextResponse.json({
    ok: true,
    message: "Personenbezogene Daten wurden gemäß DSGVO Art. 17 anonymisiert.",
  });
}
