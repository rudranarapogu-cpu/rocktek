import { Link, useNavigate } from "@tanstack/react-router";
import { Mountain, Menu, X, Search, ShoppingBag, ChevronDown, MapPin, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { HEADER_NAV, ROLE_LABEL, ORDERS_LINK, activeRole, type Role } from "@/lib/navigation";
import { NotificationBell } from "@/components/notification-bell";
import { DISTRICTS, useDistrict } from "@/lib/district";

interface Cat { name: string; slug: string }

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Cat[]>([]);
  const [district, setDistrict] = useDistrict();

  const role = activeRole(roles as Role[]);
  const links = user ? HEADER_NAV[role] : HEADER_NAV.public;
  const isRole = role !== "public";

  // Only surface categories that currently have live inventory.
  useEffect(() => {
    supabase
      .from("listings")
      .select("categories(name,slug)")
      .eq("status", "active")
      .then(({ data }) => {
        const map = new Map<string, Cat>();
        (data ?? []).forEach((r: any) => {
          const c = r.categories;
          if (c?.slug) map.set(c.slug, { name: c.name, slug: c.slug });
        });
        setCats([...map.values()]);
      });
  }, []);

  const runSearch = () =>
    navigate({ to: "/marketplace", search: { q: q || undefined, district } as any });

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      {/* PRIMARY BAR */}
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </span>
          <span className="hidden font-display text-2xl leading-none tracking-wide sm:inline">
            ROCK<span className="text-flame">TEK</span>
          </span>
        </Link>

        {/* District selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-left text-sm hover:bg-muted md:flex">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">District</span>
              <span className="font-medium">{district}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Delivering to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DISTRICTS.map((d) => (
              <DropdownMenuItem key={d} onClick={() => setDistrict(d)}>
                {d}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Category dropdown */}
        {cats.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden shrink-0 items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted lg:flex">
              Categories <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {cats.map((c) => (
                <DropdownMenuItem key={c.slug} asChild>
                  <Link to="/marketplace" search={{ category: c.slug } as any}>{c.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(); }}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-card px-2.5"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stone type, finish…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </form>

        {/* Account + orders */}
        <div className="flex shrink-0 items-center gap-1">
          {user && <NotificationBell />}

          {user && isRole && (
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Bookings & Orders">
              <Link to={ORDERS_LINK[role as Role]}><ShoppingBag className="h-5 w-5" /></Link>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden items-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-sm hover:bg-muted sm:flex">
                <User className="h-4 w-4" />
                <span className="max-w-[9rem] truncate font-medium">{isRole ? ROLE_LABEL[role as Role] : "Account"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {links.map((l) => (
                  <DropdownMenuItem key={l.to + l.label} asChild>
                    <Link to={l.to}><l.icon className="mr-2 h-4 w-4" />{l.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm"><Link to="/auth/login">Login</Link></Button>
              <Button asChild size="sm" className="bg-primary"><Link to="/auth/signup">Get Started</Link></Button>
            </div>
          )}

          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-muted sm:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* SECONDARY CHIP BAR — quick category filters (live inventory only) */}
      {cats.length > 0 && (
        <div className="border-t border-border/60 bg-background/60">
          <div className="mx-auto flex h-10 max-w-7xl items-center gap-2 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              to="/marketplace"
              className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary"
            >
              All inventory
            </Link>
            {cats.map((c) => (
              <Link
                key={c.slug}
                to="/marketplace"
                search={{ category: c.slug } as any}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* MOBILE MENU */}
      {open && (
        <div className="border-t border-border bg-background sm:hidden">
          <div className="flex flex-col gap-1 p-4">
            <div className="mb-2 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="flex-1 bg-transparent outline-none"
              >
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {user ? (
              <>
                {links.map((l) => (
                  <Link key={l.to + l.label} to={l.to} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-muted">
                    <l.icon className="h-4 w-4" />{l.label}
                  </Link>
                ))}
                <button onClick={() => { signOut(); setOpen(false); }} className="rounded-md px-3 py-2.5 text-left text-sm hover:bg-muted">Sign out</button>
              </>
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
