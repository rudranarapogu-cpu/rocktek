import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, Store, Truck, Boxes, Radar } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, roles } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth/login" });
    if (!loading && user && !roles.includes("admin")) nav({ to: "/" });
  }, [user, loading, roles, nav]);

  if (!loading && user && !roles.includes("admin")) return null;

  return (
    <DashboardLayout
      nav={[
        { to: "/admin", icon: BarChart3, label: "Analytics", exact: true },
        { to: "/admin/sellers", icon: Store, label: "Seller Verification" },
        { to: "/admin/drivers", icon: Truck, label: "Driver Verification" },
        { to: "/admin/inventory", icon: Boxes, label: "Inventory" },
        { to: "/admin/logistics", icon: Radar, label: "Logistics" },
      ]}
    />
  );
}
