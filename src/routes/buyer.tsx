import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShoppingBag, User } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/buyer")({
  component: BuyerLayout,
});

function BuyerLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth/login" });
  }, [user, loading, nav]);

  return (
    <DashboardLayout
      nav={[
        { to: "/buyer", icon: ShoppingBag, label: "Orders", exact: true },
        { to: "/buyer/profile", icon: User, label: "Profile" },
      ]}
    />
  );
}
