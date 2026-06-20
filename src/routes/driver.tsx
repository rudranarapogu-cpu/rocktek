import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Package, Navigation, Camera } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/driver")({
  component: DriverLayout,
});

function DriverLayout() {
  const { user, loading, roles } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth/login" });
    if (!loading && user && !roles.includes("driver") && !roles.includes("admin")) {
      nav({ to: "/driver/onboarding" });
    }
  }, [user, loading, roles, nav]);

  return (
    <DashboardLayout
      nav={[
        { to: "/driver", icon: Package, label: "Assigned Loads", exact: true },
        { to: "/driver/active", icon: Navigation, label: "Active Trips & GPS" },
        { to: "/driver/proof", icon: Camera, label: "Delivery Proof" },
      ]}
    />
  );
}
