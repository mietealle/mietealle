"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/ui/notification-bell";

interface UserInfo {
  name?: string | null | undefined;
  email?: string | null | undefined;
  initials: string;
}

interface Props {
  brand: string;
  portalLabel: string;
  brandColor?: "brand" | "dark";
  user: UserInfo;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarShell({ brand, portalLabel, brandColor = "brand", user, sidebar, children }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const avatarBg = brandColor === "dark" ? "bg-gray-700 text-white" : "bg-brand-100 text-brand-700";

  return (
    <div className="flex min-h-screen">
      {/* ── Mobile overlay ─────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out",
          "lg:relative lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 opacity-60 hover:opacity-100 lg:hidden"
          style={{ color: "inherit" }}
          aria-label="Menü schließen"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebar}
      </aside>

      {/* ── Main column ────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ── Top bar — always visible ───────────────────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2.5 shadow-sm">
          {/* Left: hamburger (mobile) + brand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Menü öffnen"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className={`text-sm font-bold ${brandColor === "dark" ? "text-gray-900" : "text-brand-700"}`}>
              {brand}
            </span>
            <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 sm:block">
              {portalLabel}
            </span>
          </div>

          {/* Right: notification bell + user info + sign out */}
          <div className="flex items-center gap-1.5">
            <NotificationBell />

            {/* User avatar + name */}
            <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarBg}`}>
                {user.initials}
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-semibold leading-none text-gray-800">
                  {user.name ?? user.email?.split("@")[0] ?? "—"}
                </span>
                {user.email && (
                  <span className="mt-0.5 text-xs leading-none text-gray-400">{user.email}</span>
                )}
              </div>
            </div>

            {/* Sign-out button */}
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Abmelden</span>
            </Link>
          </div>
        </header>

        {/* ── Page content ───────────────────────────────── */}
        <main className="flex-1 bg-gray-50 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
