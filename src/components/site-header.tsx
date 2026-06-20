import { Link } from "@tanstack/react-router";
import { Mountain, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const dash = roles.includes("admin")
    ? { to: "/admin", label: "Admin" }
    : roles.includes("seller")
      ? { to: "/seller", label: "Seller Dashboard" }
      : roles.includes("driver")
        ? { to: "/driver", label: "Driver Dashboard" }
        : { to: "/buyer", label: "My Dashboard" };

  const links = [
    { to: "/", label: "Home" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/categories", label: "Categories" },
    { to: "/sell", label: "Sell on RockTek" },
    { to: "/driver/onboarding", label: "Drive" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-glow">
            <Mountain className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl tracking-wide leading-none">
            ROCK<span className="text-flame">TEK</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to={dash.to}>{dash.label}</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth/login">Login</Link></Button>
              <Button asChild size="sm" className="bg-primary"><Link to="/auth/signup">Get Started</Link></Button>
            </>
          )}
        </div>

        <button
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="flex flex-col gap-1 p-4">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {user ? (
              <>
                <Link to={isSeller ? "/seller" : "/account"} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                  {isSeller ? "Seller Dashboard" : "My Account"}
                </Link>
                <button onClick={() => { signOut(); setOpen(false); }} className="text-left rounded-md px-3 py-2 text-sm hover:bg-muted">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/auth/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Login</Link>
                <Link to="/auth/signup" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
