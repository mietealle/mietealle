"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, verificationVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Pencil, ShieldOff, ShieldCheck, Trash2, X, Save } from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  verificationStatus: string;
  status: string;
  company: string | null;
  phone: string | null;
  commissionRate: number;
  createdAt: Date;
  _count: { products: number; bookings: number };
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: "Aktiv",     cls: "bg-green-100 text-green-700" },
  SUSPENDED: { label: "Gesperrt",  cls: "bg-orange-100 text-orange-700" },
  DELETED:   { label: "Gelöscht",  cls: "bg-red-100 text-red-600 line-through" },
};

export function AdminUserRow({ user }: { user: UserData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [suspending, setSuspending] = useState(false);

  // Edit form state
  const [name, setName]             = useState(user.name ?? "");
  const [email, setEmail]           = useState(user.email);
  const [company, setCompany]       = useState(user.company ?? "");
  const [phone, setPhone]           = useState(user.phone ?? "");
  const [commission, setCommission] = useState(String(user.commissionRate));

  const isDeleted = user.status === "DELETED";

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...payload }),
    });
    return res.ok;
  }

  async function saveEdit() {
    setSaving(true);
    await patch({
      name: name.trim() || null,
      email: email.trim(),
      company: company.trim() || null,
      phone: phone.trim() || null,
      ...(user.role === "VENDOR" ? { commissionRate: parseFloat(commission) || 10 } : {}),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function toggleSuspend() {
    setSuspending(true);
    await patch({ status: user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" });
    setSuspending(false);
    router.refresh();
  }

  async function gdprDelete() {
    setDeleting(true);
    await fetch(`/api/admin/users?userId=${user.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(false);
    router.refresh();
  }

  const statusMeta = STATUS_BADGE[user.status] ?? STATUS_BADGE["ACTIVE"]!;

  return (
    <>
      {/* ── Normal row ─────────────────────────────────────────────────── */}
      <tr className={`hover:bg-gray-50 ${isDeleted ? "opacity-50" : ""}`}>
        <td className="px-4 py-3">
          <p className="font-medium text-gray-900">{user.name ?? <span className="italic text-gray-400">—</span>}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
          {user.company && <p className="text-xs text-gray-400">{user.company}</p>}
        </td>
        <td className="px-4 py-3">
          <Badge variant={user.role === "ADMIN" ? "danger" : user.role === "VENDOR" ? "info" : "default"}>
            {user.role}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <Badge variant={verificationVariant(user.verificationStatus)}>{user.verificationStatus}</Badge>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.cls}`}>
            {statusMeta.label}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600">
          {user.role === "VENDOR" ? `${user.commissionRate}%` : "—"}
        </td>
        <td className="px-4 py-3 text-gray-500">
          {user._count.products} / {user._count.bookings}
        </td>
        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>
        <td className="px-4 py-3">
          {!isDeleted && (
            <div className="flex items-center gap-1">
              {/* Edit */}
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Bearbeiten"
              >
                <Pencil className="h-4 w-4" />
              </button>

              {/* Suspend / Unsuspend */}
              <button
                onClick={toggleSuspend}
                disabled={suspending}
                className={`rounded p-1.5 hover:bg-gray-100 ${
                  user.status === "SUSPENDED"
                    ? "text-green-500 hover:text-green-700"
                    : "text-orange-400 hover:text-orange-600"
                }`}
                title={user.status === "SUSPENDED" ? "Reaktivieren" : "Sperren"}
              >
                {user.status === "SUSPENDED"
                  ? <ShieldCheck className="h-4 w-4" />
                  : <ShieldOff className="h-4 w-4" />
                }
              </button>

              {/* GDPR Delete */}
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                title="DSGVO-Löschung"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* ── Edit drawer (renders as extra row) ─────────────────────────── */}
      {editing && (
        <tr>
          <td colSpan={8} className="bg-blue-50 px-4 py-4">
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold text-gray-900 text-sm">Nutzer bearbeiten</p>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Field label="Name" value={name} onChange={setName} />
              <Field label="E-Mail" value={email} onChange={setEmail} type="email" />
              <Field label="Unternehmen" value={company} onChange={setCompany} />
              <Field label="Telefon" value={phone} onChange={setPhone} type="tel" />
              {user.role === "VENDOR" && (
                <Field label="Provision (%)" value={commission} onChange={setCommission} type="number" min="0" max="100" step="0.5" />
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" loading={saving} onClick={saveEdit}>
                <Save className="h-4 w-4" /> Speichern
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
                Abbrechen
              </Button>
            </div>
          </td>
        </tr>
      )}

      {/* ── GDPR delete confirmation ────────────────────────────────────── */}
      {confirmDelete && (
        <tr>
          <td colSpan={8} className="bg-red-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-red-800">DSGVO-Löschung bestätigen</p>
                <p className="mt-1 text-sm text-red-700">
                  Alle personenbezogenen Daten (Name, E-Mail, Telefon, Unternehmen) werden
                  gemäß <strong>DSGVO Art. 17</strong> unwiderruflich anonymisiert.
                  Buchungs- und Rechnungsdaten bleiben für die gesetzliche Aufbewahrungspflicht
                  (<strong>§ 147 AO, 10 Jahre</strong>) erhalten. Das Konto wird dauerhaft gesperrt.
                </p>
                <p className="mt-2 text-xs text-red-500">
                  Dieser Vorgang wird im Audit-Log festgehalten und kann nicht rückgängig gemacht werden.
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="danger" loading={deleting} onClick={gdprDelete}>
                <Trash2 className="h-4 w-4" /> Endgültig löschen (DSGVO)
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                Abbrechen
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Field({
  label, value, onChange, type = "text", min, max, step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type} value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}
