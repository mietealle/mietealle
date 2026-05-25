import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge, verificationVariant } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AdminUserActions } from "@/components/admin/user-actions";
import { AdminUserRow } from "@/components/admin/user-row";

export const metadata: Metadata = { title: "Nutzerverwaltung" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true,
      verificationStatus: true, status: true,
      company: true, phone: true, commissionRate: true,
      createdAt: true,
      _count: { select: { products: true, bookings: true } },
    },
    orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
  });

  const pending = users.filter((u) => u.role === "VENDOR" && u.verificationStatus === "PENDING");
  const others = users.filter((u) => !(u.role === "VENDOR" && u.verificationStatus === "PENDING"));

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nutzerverwaltung</h1>
        <div className="flex gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            {users.length} gesamt
          </span>
          {pending.length > 0 && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
              {pending.length} ausstehend
            </span>
          )}
        </div>
      </div>

      {/* ── Pending vendor approvals ─────────────────────────────────────── */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            Ausstehende Vermieter-Genehmigungen ({pending.length})
          </h2>
          <div className="grid gap-3">
            {pending.map((u) => (
              <Card key={u.id} className="border-yellow-200 bg-yellow-50">
                <div className="flex items-start gap-4 p-5">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-200 text-base font-bold text-yellow-700">
                    {(u.name ?? u.email)[0]?.toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      {u.company && <span className="text-sm text-gray-500">· {u.company}</span>}
                    </div>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    {u.phone && <p className="text-sm text-gray-400">{u.phone}</p>}
                    <p className="mt-1 text-xs text-gray-400">
                      Registriert: {formatDate(u.createdAt)}
                    </p>
                  </div>
                  {/* Approve / reject widget */}
                  <div className="shrink-0">
                    <AdminUserActions userId={u.id} currentCommission={u.commissionRate} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── All users table ───────────────────────────────────────────────── */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                {["Nutzer", "Rolle", "Status", "Konto", "Provision", "Prod / Buch", "Seit", "Aktionen"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {others.map((u) => (
                <AdminUserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
