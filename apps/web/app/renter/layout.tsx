import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LayoutDashboard, Search, CalendarCheck, Heart } from "lucide-react";
import { SidebarShell } from "@/components/ui/sidebar-shell";

const nav = [
  { href: "/renter/dashboard", label: "Dashboard",         Icon: LayoutDashboard },
  { href: "/renter/browse",    label: "Maschinen suchen",  Icon: Search },
  { href: "/renter/bookings",  label: "Meine Buchungen",   Icon: CalendarCheck },
  { href: "/renter/favorites", label: "Favoriten",         Icon: Heart },
];

export default async function RenterLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "RENTER") redirect("/login");

  const user = {
    name: session.user.name,
    email: session.user.email,
    initials: ((session.user.name ?? session.user.email) ?? "M")[0]!.toUpperCase(),
  };

  const sidebar = (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Brand header */}
      <div className="border-b border-gray-200 px-6 py-5">
        <p className="text-lg font-bold text-brand-700">Mietealle</p>
        <p className="text-xs text-gray-400">Mieter-Portal</p>
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
    <SidebarShell brand="Mietealle" portalLabel="Mieter" user={user} sidebar={sidebar}>
      {children}
    </SidebarShell>
  );
}
