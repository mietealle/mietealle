import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variants = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function bookingStatusVariant(status: string): keyof typeof variants {
  const map: Record<string, keyof typeof variants> = {
    PENDING: "warning",
    CONFIRMED: "info",
    ACTIVE: "success",
    DISPATCHED: "info",
    DELIVERED: "success",
    RETURN_INITIATED: "warning",
    RETURN_DISPATCHED: "warning",
    RETURNED: "default",
    COMPLETED: "default",
    CANCELLED: "danger",
  };
  return map[status] ?? "default";
}

export function verificationVariant(status: string): keyof typeof variants {
  const map: Record<string, keyof typeof variants> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
  };
  return map[status] ?? "default";
}
