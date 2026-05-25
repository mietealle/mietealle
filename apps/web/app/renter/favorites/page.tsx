import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Favoriten" };

export default function FavoritesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Favoriten</h1>
      <Card>
        <CardContent className="py-12 text-center text-gray-400">
          Favoritenfunktion kommt bald.
        </CardContent>
      </Card>
    </div>
  );
}
