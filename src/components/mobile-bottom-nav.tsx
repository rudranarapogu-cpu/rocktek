import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { MOBILE_NAV, activeRole, type Role } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom navigation for mobile. Renders the role-appropriate menu.
 * Hidden on lg+ where the header nav is used instead.
 */
export function MobileBottomNav() {
  const { user, roles } = useAuth();
  const role = activeRole(roles as Role[]);
  const links = user ? MOBILE_NAV[role] : MOBILE_NAV.public;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {links.map((l) => (
          <li key={l.to + l.label} className="flex-1">
            <Link
              to={l.to}
              activeOptions={{ exact: l.exact }}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors"
              activeProps={{ className: "!text-primary" }}
            >
              <l.icon className="h-5 w-5" />
              <span className="leading-none">{l.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Spacer so fixed bottom nav doesn't overlap page content on mobile. */
export function MobileBottomNavSpacer() {
  return <div className={cn("h-16 lg:hidden")} aria-hidden />;
}
