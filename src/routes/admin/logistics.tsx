import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TripMap } from "@/components/trip-map";
import { useTripLive } from "@/hooks/use-trip-live";
import { TRIP_STATUS_LABEL, tripProgress, inr, type TripStatus } from "@/lib/logistics";
import { StatusChip } from "@/components/status-chip";

export const Route = createFileRoute("/admin/logistics")({
  component: AdminLogistics,
});

function AdminLogistics() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("trips")
      .select("*,orders(buyer_name,total_amount,created_at,delivery_district,listings(title)),drivers(full_name,vehicle_number),sellers(company_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setTrips(data ?? []); setLoading(false); });
  }, []);

  const active = trips.filter((t) => t.status !== "delivered");

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Admin</p>
      <h1 className="mt-1 font-display text-3xl">Logistics Monitoring</h1>
      <p className="mt-1 text-sm text-muted-foreground">{active.length} active · {trips.length - active.length} delivered</p>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" />
      ) : trips.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Radar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No shipments in the system yet.</p>
        </div>
      ) : (
        <>
          {/* Dense scannable table across all bookings */}
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium">Seller</th>
                  <th className="px-3 py-2 font-medium">Buyer</th>
                  <th className="px-3 py-2 font-medium">Driver</th>
                  <th className="px-3 py-2 font-medium">District</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-3 py-2"><StatusChip status={t.status} label={TRIP_STATUS_LABEL[t.status as TripStatus]} /></td>
                    <td className="px-3 py-2">{t.orders?.listings?.title ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.sellers?.company_name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.orders?.buyer_name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.drivers?.full_name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.orders?.delivery_district ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{t.orders?.total_amount ? inr(Number(t.orders.total_amount)) : "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.orders?.created_at ? new Date(t.orders.created_at).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live GPS monitoring */}
          <h2 className="mt-8 font-display text-xl">Live GPS monitoring</h2>
          <div className="mt-3 grid gap-5 lg:grid-cols-2">{trips.map((t) => <MonitorCard key={t.id} trip={t} />)}</div>
        </>
      )}
    </div>
  );
}

function MonitorCard({ trip }: { trip: any }) {
  const live = useTripLive(trip.id, trip);
  const status = (live?.status ?? trip.status) as TripStatus;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg">{trip.orders?.listings?.title ?? "Shipment"}</p>
        <StatusChip status={status} label={TRIP_STATUS_LABEL[status]} />
      </div>
      <p className="text-sm text-muted-foreground">{trip.sellers?.company_name} → {trip.orders?.buyer_name} · {trip.drivers?.full_name} ({trip.drivers?.vehicle_number})</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${tripProgress(status)}%` }} />
      </div>
      <div className="mt-3"><TripMap lat={live?.current_lat} lng={live?.current_lng} updatedAt={live?.updated_at} /></div>
    </div>
  );
}
