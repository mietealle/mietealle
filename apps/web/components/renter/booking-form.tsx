"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, calculateRentalDays } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Calendar, Truck, Shield, AlertCircle, MapPin, Info } from "lucide-react";

interface Props {
  productId: string;
  pricePerDay: number;
  quantity: number;
  transportAvailable: boolean;
  transportCost: number;
  insuranceAvailable: boolean;
  insuranceCostPerDay: number;
  bookedRanges: Array<{ start: string; end: string }>;
  renterId: string | undefined;
}

function DateInput({ label, value, min, onChange }: { label: string; value: string; min?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <input type="date" value={value} min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" />
    </div>
  );
}

export function BookingForm({
  productId, pricePerDay, quantity, transportAvailable, transportCost,
  insuranceAvailable, insuranceCostPerDay, bookedRanges, renterId,
}: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const today = new Date().toISOString().split("T")[0]!;
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0]!;

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(tomorrow);
  const [qty, setQty]             = useState(1);
  const [withTransport, setWithTransport]   = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [withInsurance, setWithInsurance]   = useState(false);
  const [notes, setNotes]         = useState("");
  const [loading, setLoading]     = useState(false);

  const days = startDate && endDate
    ? Math.max(1, calculateRentalDays(new Date(startDate), new Date(endDate)))
    : 1;

  const rentalCost   = pricePerDay * days * qty;
  const transport    = withTransport  ? transportCost                     : 0;
  const insurance    = withInsurance  ? insuranceCostPerDay * days * qty  : 0;
  const deposit      = pricePerDay * Math.min(5, days) * qty;
  const total        = rentalCost + transport + insurance;

  function handleStartChange(v: string) {
    setStartDate(v);
    const next = new Date(v);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().split("T")[0]!;
    if (!endDate || endDate <= v) setEndDate(nextStr);
  }

  async function handleBook() {
    if (!renterId) { router.push("/login"); return; }
    if (withTransport && !deliveryAddress.trim()) {
      toastError("Lieferadresse fehlt", "Bitte geben Sie eine Lieferadresse ein, wenn Transport gewünscht wird.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/renter/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId, startDate, endDate, quantity: qty,
        transportIncluded: withTransport,
        deliveryAddress: withTransport ? deliveryAddress.trim() : null,
        insuranceIncluded: withInsurance,
        notes: notes.trim() || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json() as { error?: string };
      toastError("Buchung fehlgeschlagen", data.error ?? "Bitte versuchen Sie es erneut.");
      setLoading(false);
      return;
    }

    success("Buchung eingegangen!", "Der Vermieter prüft Ihre Anfrage und meldet sich.");
    setTimeout(() => router.push("/renter/bookings"), 1000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Section 1: Dates ──────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-brand-600" /> Zeitraum wählen
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <DateInput label="Von" value={startDate} min={today} onChange={handleStartChange} />
            <DateInput
              label="Bis"
              value={endDate}
              min={new Date(new Date(startDate).getTime() + 86_400_000).toISOString().split("T")[0] ?? ""}
              onChange={setEndDate}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
            <span className="text-sm text-brand-700">Mietdauer</span>
            <span className="font-bold text-brand-700">{days} Tag{days !== 1 ? "e" : ""}</span>
          </div>

          {/* Qty selector if multiple units */}
          {quantity > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Stückzahl (max. {quantity})
              </label>
              <div className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-lg">−</button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button type="button"
                  onClick={() => setQty((q) => Math.min(quantity, q + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-lg">+</button>
              </div>
            </div>
          )}

          {/* Booked ranges warning */}
          {bookedRanges.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              <div>
                <p className="text-xs font-semibold text-yellow-700">Bereits gebuchte Zeiträume</p>
                <ul className="mt-1 space-y-0.5 text-xs text-yellow-600">
                  {bookedRanges.slice(0, 4).map((r, i) => (
                    <li key={i}>{r.start} – {r.end}</li>
                  ))}
                  {bookedRanges.length > 4 && <li>…und {bookedRanges.length - 4} weitere</li>}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Add-ons ────────────────────────────────── */}
      {(transportAvailable || insuranceAvailable) && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Optionale Zusatzleistungen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Transport card */}
            {transportAvailable && (
              <div className={[
                "rounded-xl border-2 transition-colors",
                withTransport ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white",
              ].join(" ")}>
                <label className="flex cursor-pointer items-start gap-3 p-4">
                  <input type="checkbox" checked={withTransport}
                    onChange={(e) => { setWithTransport(e.target.checked); if (!e.target.checked) setDeliveryAddress(""); }}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600" />
                  <Truck className={`mt-0.5 h-5 w-5 shrink-0 ${withTransport ? "text-brand-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">Transport</p>
                      <p className="font-bold text-brand-700">+ {formatCurrency(transportCost)}</p>
                    </div>
                    <p className="text-sm text-gray-500">Lieferung an Ihre Adresse &amp; Abholung durch den Vermieter.</p>
                  </div>
                </label>

                {withTransport && (
                  <div className="border-t border-brand-200 px-4 pb-4 pt-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      <MapPin className="h-3.5 w-3.5" /> Lieferadresse *
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={2}
                      required
                      placeholder="Straße, Hausnummer, PLZ, Ort"
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Insurance card */}
            {insuranceAvailable && (
              <div className={[
                "rounded-xl border-2 transition-colors",
                withInsurance ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
              ].join(" ")}>
                <label className="flex cursor-pointer items-start gap-3 p-4">
                  <input type="checkbox" checked={withInsurance}
                    onChange={(e) => setWithInsurance(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                  <Shield className={`mt-0.5 h-5 w-5 shrink-0 ${withInsurance ? "text-blue-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">Maschinenversicherung</p>
                      <p className="font-bold text-blue-700">+ {formatCurrency(insurance || insuranceCostPerDay)}/Tag</p>
                    </div>
                    <p className="text-sm text-gray-500">Absicherung gegen Schäden während der Mietzeit.</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatCurrency(insuranceCostPerDay)} × {days} Tag{days !== 1 ? "e" : ""} = {formatCurrency(insurance || insuranceCostPerDay * days)}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Section 3: Notes ─────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Anmerkungen (optional)
            </span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Besondere Anforderungen, geplanter Einsatzort…" />
          </label>
        </CardContent>
      </Card>

      {/* ── Section 4: Price summary ──────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Kostenübersicht</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{formatCurrency(pricePerDay)}/Tag × {days}{qty > 1 ? ` × ${qty} Stk.` : ""}</span>
              <span>{formatCurrency(rentalCost)}</span>
            </div>
            {withTransport && (
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-brand-500" /> Transport</span>
                <span>{formatCurrency(transport)}</span>
              </div>
            )}
            {withInsurance && (
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-blue-500" /> Versicherung</span>
                <span>{formatCurrency(insurance)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900 text-base">
              <span>Gesamtbetrag</span>
              <span className="text-brand-700">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Deposit note */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-xs text-amber-700">
              <p className="font-semibold">Anzahlung: {formatCurrency(deposit)}</p>
              <p className="mt-0.5">Entspricht 5 Miettagen. Fällig nach Bestätigung durch den Vermieter. Restbetrag bei Übergabe.</p>
            </div>
          </div>

          <Button onClick={handleBook} loading={loading} className="mt-4 w-full py-3 text-base font-semibold">
            Jetzt anfragen →
          </Button>
          <p className="mt-2 text-center text-xs text-gray-400">
            Noch keine Zahlung — der Vermieter bestätigt zuerst.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
