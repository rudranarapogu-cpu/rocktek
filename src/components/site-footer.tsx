import { Link } from "@tanstack/react-router";
import { Mountain, Mail, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><Mountain className="h-4 w-4" /></span>
            <span className="font-display text-xl">ROCK<span className="text-flame">TEK</span></span>
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">© {new Date().getFullYear()} RockTek Services</p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/marketplace" className="hover:text-primary">Marketplace</Link>
          <Link to="/sellers" className="hover:text-primary">Sellers</Link>
          <Link to="/about" className="hover:text-primary">About</Link>
          <Link to="/contact" className="hover:text-primary">Contact</Link>
        </nav>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <a href="mailto:hello@rocktek.in" className="inline-flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> hello@rocktek.in</a>
          <a href="tel:+910000000000" className="inline-flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /> +91 00000 00000</a>
        </div>
      </div>
    </footer>
  );
}
