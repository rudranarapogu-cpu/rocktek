import { Link, Outlet } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export interface DashNav {
  to: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
}

export function DashboardLayout({ nav }: { nav: DashNav[] }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-row gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2 lg:flex-col">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-muted"
              activeOptions={{ exact: n.exact }}
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </aside>
        <main className="min-w-0"><Outlet /></main>
      </div>
      <SiteFooter />
    </div>
  );
}
