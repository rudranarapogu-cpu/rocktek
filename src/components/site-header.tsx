import { Link } from "@tanstack/react-router";
import { Mountain, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { HEADER_NAV, activeRole, type Role } from "@/lib/navigation";
import { NotificationBell } from "@/components/notification-bell";

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const role = activeRole(roles as Role[]);
  const links = user ? HEADER_NAV[role] : HEADER_NAV.public;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-glow">
            <Mountain className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl leading-none tracking-wide">
            ROCK<span className="text-flame">TEK</span>
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-6 overflow-hidden lg:flex">
          {links.map((l) => (
            <Link
              key={l.to + l.label}
              to={l.to}
              className="whitespace-nowrap text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              activeOptions={{ exact: l.exact }}
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {user ? (
            <>
              <NotificationBell />
              <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth/login">Login</Link></Button>
              <Button asChild size="sm" className="bg-primary"><Link to="/auth/signup">Get Started</Link></Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {user && <NotificationBell />}
          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>


      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="flex flex-col gap-1 p-4">
            {links.map((l) => (
              <Link
                key={l.to + l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted"
                activeOptions={{ exact: l.exact }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {user ? (
              <button onClick={() => { signOut(); setOpen(false); }} className="rounded-md px-3 py-2.5 text-left text-sm hover:bg-muted">Sign out</button>
            ) : (
              <>
                <Link to="/auth/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm hover:bg-muted">Login</Link>
                <Link to="/auth/signup" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2.5 text-sm text-primary-foreground">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
