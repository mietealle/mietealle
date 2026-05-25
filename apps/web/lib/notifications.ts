import { prisma } from "@/lib/prisma";
import type { Prisma } from "@mietealle/db";

export async function createNotification({
  userId,
  type,
  title,
  message,
  entityId,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, title, message, entityId: entityId ?? null },
  });
}

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entity,
      entityId,
      ...(details !== undefined ? { details: details as unknown as Prisma.InputJsonValue } : {}),
    },
  });
}
