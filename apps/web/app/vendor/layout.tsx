import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LayoutDashboard, Package, CalendarCheck } from "lucide-react";
import { SidebarShell } from "@/components/ui/sidebar-shell";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/vendor/products",  label: "Maschinen",  Icon: Package },
  { href: "/vendor/bookings",  label: "Buchungen",  Icon: CalendarCheck },
];

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "VENDOR") redirect("/login");

  const user = {
    name: session.user.name,
    email: session.user.email,
    initials: ((session.user.name ?? session.user.email) ?? "V")[0]!.toUpperCase(),
  };

  const sidebar = (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Brand header */}
      <div className="border-b border-gray-200 px-6 py-5">
        <p className="text-lg font-bold text-brand-700">Mietealle</p>
        <p className="text-xs text-gray-400">Vermieter-Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map(({ href, label, Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <SidebarShell brand="Mietealle" portalLabel="Vermieter" user={user} sidebar={sidebar}>
      {children}
    </SidebarShell>
  );
}
