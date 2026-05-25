"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Package, CheckCircle2, Truck, RotateCcw, ShieldCheck, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string; type: string; title: string; message: string;
  read: boolean; createdAt: string; entityId?: string | null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Gerade eben";
  if (m < 60) return `Vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Vor ${h} Std.`;
  return `Vor ${Math.floor(h / 24)} Tag${Math.floor(h / 24) !== 1 ? "en" : ""}`;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  BOOKING_CREATED:    <Package        className="h-4 w-4 text-brand-600" />,
  ACCOUNT_APPROVED:   <CheckCircle2   className="h-4 w-4 text-green-600" />,
  ACCOUNT_REJECTED:   <AlertTriangle  className="h-4 w-4 text-red-500"   />,
  ACCOUNT_SUSPENDED:  <AlertTriangle  className="h-4 w-4 text-orange-500"/>,
  ACCOUNT_REACTIVATED:<CheckCircle2   className="h-4 w-4 text-green-600" />,
  RETURN_INITIATED:   <RotateCcw      className="h-4 w-4 text-yellow-600"/>,
};

function getIcon(type: string) {
  if (TYPE_ICON[type]) return TYPE_ICON[type];
  if (type.startsWith("DISPATCH_DISPATCH")) return <Truck         className="h-4 w-4 text-brand-600" />;
  if (type.startsWith("DISPATCH_RETURN"))   return <RotateCcw     className="h-4 w-4 text-yellow-600"/>;
  if (type.startsWith("DISPATCH_RETURN"))   return <ShieldCheck   className="h-4 w-4 text-green-600" />;
  return <Bell className="h-4 w-4 text-gray-400" />;
}

export function NotificationBell() {
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [unread, setUnread]   = useState(0);
  const [open, setOpen]       = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json() as { notifications: Notification[]; unreadCount: number };
      setNotifs(data.notifications);
      setUnread(data.unreadCount);
    } catch { /* ignore */ }
  }, []);

  const markRead = useCallback(async () => {
    if (unread === 0) return;
    await fetch("/api/notifications", { method: "PATCH" });
    setUnread(0);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [unread]);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle() {
    setOpen((v) => {
      if (!v) markRead();
      return !v;
    });
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button onClick={toggle} aria-label="Benachrichtigungen"
        className={cn(
          "relative rounded-xl p-2 transition-colors",
          open ? "bg-brand-100 text-brand-700" : "text-gray-500 hover:bg-gray-100"
        )}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-semibold text-gray-900">Benachrichtigungen</p>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <Bell className="h-8 w-8 opacity-40" />
                <p className="text-sm">Keine Benachrichtigungen</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div key={n.id}
                  className={cn(
                    "flex items-start gap-3 border-b border-gray-50 px-4 py-3 last:border-0 transition-colors",
                    !n.read && "bg-brand-50"
                  )}>
                  <div className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    !n.read ? "bg-brand-100" : "bg-gray-100"
                  )}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{n.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500 leading-snug">{n.message}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
