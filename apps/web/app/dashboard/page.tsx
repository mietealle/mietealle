import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardRedirect() {
  const session = await getSession();
  if (!session) redirect("/login");
  const map = { VENDOR: "/vendor/dashboard", RENTER: "/renter/dashboard", ADMIN: "/admin/dashboard" };
  redirect(map[session.user.role] ?? "/login");
}
