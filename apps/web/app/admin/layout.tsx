import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LayoutDashboard, Users, Package, CalendarCheck } from "lucide-react";
import { SidebarShell } from "@/components/ui/sidebar-shell";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/admin/users",     label: "Nutzer",      Icon: Users },
  { href: "/admin/products",  label: "Produkte",    Icon: Package },
  { href: "/admin/bookings",  label: "Buchungen",   Icon: CalendarCheck },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const user = {
    name: session.user.name,
    email: session.user.email,
    initials: ((session.user.name ?? session.user.email) ?? "A")[0]!.toUpperCase(),
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Brand header */}
      <div className="border-b border-gray-700 px-6 py-5">
        <p className="text-lg font-bold text-white">Mietealle</p>
        <p className="text-xs text-gray-400">Admin-Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map(({ href, label, Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <SidebarShell brand="Mietealle" portalLabel="Admin" brandColor="dark" user={user} sidebar={sidebar}>
      {children}
    </SidebarShell>
  );
}
