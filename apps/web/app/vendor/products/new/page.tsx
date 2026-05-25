"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Link as LinkIcon } from "lucide-react";

const CATEGORIES = [
  "CONSTRUCTION","LIFTING_CRANES","EARTHMOVING","COMPACTION","POWER_GENERATION",
  "MATERIAL_HANDLING","CONCRETE_PUMPING","AERIAL_WORK_PLATFORMS","DEMOLITION","OTHER",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  CONSTRUCTION:"Bauwesen", LIFTING_CRANES:"Hebe- & Krantechnik", EARTHMOVING:"Erdbewegung",
  COMPACTION:"Verdichtung", POWER_GENERATION:"Stromerzeugung", MATERIAL_HANDLING:"Materialhandling",
  CONCRETE_PUMPING:"Betonpumpen", AERIAL_WORK_PLATFORMS:"Arbeitsbühnen", DEMOLITION:"Abbruch", OTHER:"Sonstiges",
};

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [transportAvailable, setTransportAvailable] = useState(false);
  const [insuranceAvailable, setInsuranceAvailable] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function addImageUrl() {
    const url = imageInput.trim();
    if (url && !imageUrls.includes(url)) setImageUrls((prev) => [...prev, url]);
    setImageInput("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === "string") setImageUrls((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/vendor/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description"),
        category: fd.get("category"),
        pricePerDay: parseFloat(fd.get("pricePerDay") as string),
        images: imageUrls,
        location: fd.get("location"),
        quantity: parseInt(fd.get("quantity") as string, 10) || 1,
        transportAvailable,
        transportCost: transportAvailable ? parseFloat(fd.get("transportCost") as string) || 0 : null,
        insuranceAvailable,
        insuranceCostPerDay: insuranceAvailable ? parseFloat(fd.get("insuranceCostPerDay") as string) || 0 : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Fehler beim Erstellen.");
      setLoading(false);
      return;
    }
    router.push("/vendor/products");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Maschine hinzufügen</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Basic info */}
        <Card>
          <CardHeader><CardTitle>Grunddaten</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input id="name" name="name" label="Name" placeholder="Bagger CAT 320" required />
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">Beschreibung</label>
              <textarea id="description" name="description" rows={4} required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Technische Daten, Einsatzbereich, Zustand..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="category" className="text-sm font-medium text-gray-700">Kategorie</label>
                <select id="category" name="category" required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <Input id="location" name="location" label="Standort" placeholder="München, Bayern" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="pricePerDay" name="pricePerDay" type="number" step="0.01" min="0" label="Preis pro Tag (€)" placeholder="250.00" required />
              <Input id="quantity" name="quantity" type="number" min="1" label="Verfügbare Stückzahl" placeholder="1" required />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader><CardTitle>Bilder</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input value={imageInput} onChange={(e) => setImageInput(e.target.value)}
                placeholder="https://example.com/bild.jpg"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }} />
              <Button type="button" variant="secondary" onClick={addImageUrl}>
                <LinkIcon className="h-4 w-4" /> URL
              </Button>
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Datei
              </Button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </div>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
                    <button type="button" onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">Tipp: Bild-URLs einfügen oder Dateien hochladen. Für Produktion: Cloudinary/S3 einbinden.</p>
          </CardContent>
        </Card>

        {/* Transport */}
        <Card>
          <CardHeader><CardTitle>Transport & Versicherung</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={transportAvailable} onChange={(e) => setTransportAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600" />
              <span className="text-sm font-medium text-gray-700">Transport anbieten (kostenpflichtig)</span>
            </label>
            {transportAvailable && (
              <Input id="transportCost" name="transportCost" type="number" step="0.01" min="0"
                label="Transportkosten pro Lieferung (€)" placeholder="150.00" required={transportAvailable} />
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={insuranceAvailable} onChange={(e) => setInsuranceAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600" />
              <span className="text-sm font-medium text-gray-700">Versicherung anbieten</span>
            </label>
            {insuranceAvailable && (
              <Input id="insuranceCostPerDay" name="insuranceCostPerDay" type="number" step="0.01" min="0"
                label="Versicherung pro Tag (€)" placeholder="15.00" required={insuranceAvailable} />
            )}
          </CardContent>
        </Card>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Speichern</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/vendor/products")}>Abbrechen</Button>
        </div>
      </form>
    </div>
  );
}
