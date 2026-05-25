import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-xl font-bold text-brand-700">Mietealle</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button>Kostenlos starten</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Industriemaschinen mieten — <br />
            <span className="text-brand-600">einfach, sicher, direkt.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            Die B2B-Plattform für Baumaschinen, Hebetechnik und Industrieequipment.
            Vermieter und Mieter auf einer Plattform.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register?role=renter">
              <Button size="lg">Als Mieter registrieren</Button>
            </Link>
            <Link href="/register?role=vendor">
              <Button size="lg" variant="secondary">Als Vermieter anbieten</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    icon: "🏗️",
    title: "Tausende Maschinen",
    description: "Bagger, Kräne, Generatoren und mehr – sofort verfügbar.",
  },
  {
    icon: "✅",
    title: "Verifizierte Anbieter",
    description: "Jeder Vermieter wird manuell geprüft. Keine Überraschungen.",
  },
  {
    icon: "📅",
    title: "Echtzeit-Buchung",
    description: "Verfügbarkeit prüfen und direkt buchen. Kein Telefonieren.",
  },
];
