import { MapPin } from "lucide-react";

// Free, key-less map preview via OpenStreetMap embed.
export function TripMap({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  if (lat == null || lng == null) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
        <MapPin className="mr-2 h-4 w-4" /> Awaiting first GPS signal…
      </div>
    );
  }
  const d = 0.02;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <iframe
        title="Live truck location"
        src={src}
        className="aspect-video w-full"
        loading="lazy"
      />
      <div className="flex items-center justify-between bg-card px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> Live position</span>
        <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
      </div>
    </div>
  );
}
