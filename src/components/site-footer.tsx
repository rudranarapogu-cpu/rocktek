import { Link } from "@tanstack/react-router";
import { Mountain } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Mountain className="h-5 w-5" /></span>
              <span className="font-display text-2xl">ROCK<span className="text-accent">TEK</span></span>
            </Link>
            <p className="mt-3 text-sm text-sidebar-foreground/70 max-w-xs">
              India's verified B2B granite & stone marketplace. Direct from quarry to project.
            </p>
          </div>
          <FooterCol title="Marketplace" links={[
            { to: "/marketplace", label: "Browse Inventory" },
            { to: "/categories", label: "Categories" },
          ]} />
          <FooterCol title="Sellers" links={[
            { to: "/sell", label: "Become a Seller" },
            { to: "/auth/signup?role=seller", label: "Seller Sign-up" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
            { to: "/sellers", label: "Sellers" },
          ]} />
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-sidebar-border pt-6 text-xs text-sidebar-foreground/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} RockTek Services. All rights reserved.</p>
          <p>Verified granite. Mediated trust. Move stone faster.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm uppercase tracking-widest text-accent">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}><Link to={l.to} className="text-sidebar-foreground/80 hover:text-accent">{l.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
