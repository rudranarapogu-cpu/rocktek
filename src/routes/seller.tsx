import { createFileRoute, Link, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { Package, PlusCircle, ShieldCheck, ShieldAlert, LayoutDashboard } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/seller")({
  component: SellerLayout,
});

function SellerLayout() {
  const { user, loading, roles } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth/login" });
    if (!loading && user && !roles.includes("seller") && !roles.includes("admin")) {
      nav({ to: "/seller/onboarding" });
    }
  }, [user, loading, roles, nav]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-row gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2 lg:flex-col">
          <NavItem to="/seller" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/seller/listings" icon={Package} label="Inventory" />
          <NavItem to="/seller/upload" icon={PlusCircle} label="Upload" />
          <NavItem to="/seller/orders" icon={ShoppingBag} label="Orders" />
          <NavItem to="/seller/dispatches" icon={Truck} label="Dispatches" />
          <NavItem to="/seller/drivers" icon={Users} label="Drivers" />
          <NavItem to="/seller/onboarding" icon={ShieldCheck} label="Profile" />
        </aside>
        <main><Outlet /></main>
      </div>
      <SiteFooter />
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted" activeOptions={{ exact: to === "/seller" }} activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

export { ShieldAlert };
