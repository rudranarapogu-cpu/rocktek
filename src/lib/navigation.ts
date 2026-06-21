import {
  Home,
  Boxes,
  LayoutGrid,
  Store,
  Info,
  Phone,
  ShoppingBag,
  MapPin,
  User,
  Package,
  Truck,
  BarChart3,
  PlusCircle,
  Navigation,
  Users,
  Radar,
  type LucideIcon,
} from "lucide-react";

export type Role = "buyer" | "seller" | "driver" | "admin";

export interface NavLink {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

/** Top header links per role (public = logged out). */
export const HEADER_NAV: Record<"public" | Role, NavLink[]> = {
  public: [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/marketplace", label: "Products", icon: Boxes },
    { to: "/categories", label: "Categories", icon: LayoutGrid },
    { to: "/sellers", label: "Sellers", icon: Store },
    { to: "/about", label: "About", icon: Info },
    { to: "/contact", label: "Contact", icon: Phone },
  ],
  buyer: [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/marketplace", label: "Products", icon: Boxes },
    { to: "/buyer", label: "My Orders", icon: ShoppingBag, exact: true },
    { to: "/buyer/tracking", label: "Tracking", icon: MapPin },
    { to: "/buyer/profile", label: "Profile", icon: User },
  ],
  seller: [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/marketplace", label: "Products", icon: Boxes },
    { to: "/seller/listings", label: "Inventory", icon: Package },
    { to: "/seller/orders", label: "Orders", icon: ShoppingBag },
    { to: "/seller/dispatches", label: "Dispatch", icon: Truck },
    { to: "/seller", label: "Analytics", icon: BarChart3, exact: true },
    { to: "/seller/onboarding", label: "Profile", icon: User },
  ],
  driver: [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/marketplace", label: "Products", icon: Boxes },
    { to: "/driver", label: "Assigned Loads", icon: Package, exact: true },
    { to: "/driver/active", label: "Active Trips", icon: Navigation },
    { to: "/driver/onboarding", label: "Profile", icon: User },
  ],
  admin: [
    { to: "/admin", label: "Admin Dashboard", icon: BarChart3, exact: true },
    { to: "/admin/sellers", label: "Users", icon: Users },
    { to: "/admin/inventory", label: "Inventory", icon: Boxes },
    { to: "/admin/logistics", label: "Orders", icon: ShoppingBag },
    { to: "/admin/drivers", label: "Drivers", icon: Truck },
    { to: "/admin", label: "Analytics", icon: Radar },
  ],
};

/** Compact mobile bottom-bar links per role (max 5). */
export const MOBILE_NAV: Record<"public" | Role, NavLink[]> = {
  public: [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/marketplace", label: "Products", icon: Boxes },
    { to: "/categories", label: "Browse", icon: LayoutGrid },
    { to: "/sellers", label: "Sellers", icon: Store },
    { to: "/auth/login", label: "Login", icon: User },
  ],
  buyer: [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/marketplace", label: "Products", icon: Boxes },
    { to: "/buyer", label: "Orders", icon: ShoppingBag, exact: true },
    { to: "/buyer/tracking", label: "Tracking", icon: MapPin },
    { to: "/buyer/profile", label: "Profile", icon: User },
  ],
  seller: [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/seller/listings", label: "Inventory", icon: Package },
    { to: "/seller/orders", label: "Orders", icon: ShoppingBag },
    { to: "/seller/dispatches", label: "Dispatch", icon: Truck },
    { to: "/seller/onboarding", label: "Profile", icon: User },
  ],
  driver: [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/driver", label: "Loads", icon: Package, exact: true },
    { to: "/driver/active", label: "Trips", icon: Navigation },
    { to: "/driver/proof", label: "Tracking", icon: MapPin },
    { to: "/driver/onboarding", label: "Profile", icon: User },
  ],
  admin: [
    { to: "/admin", label: "Home", icon: BarChart3, exact: true },
    { to: "/admin/sellers", label: "Users", icon: Users },
    { to: "/admin/inventory", label: "Stock", icon: Boxes },
    { to: "/admin/logistics", label: "Logistics", icon: Radar },
    { to: "/admin/drivers", label: "Drivers", icon: Truck },
  ],
};

/** Resolve the active role from the user's role list (priority order). */
export function activeRole(roles: Role[]): "public" | Role {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("seller")) return "seller";
  if (roles.includes("driver")) return "driver";
  if (roles.includes("buyer")) return "buyer";
  return "public";
}

export const DASHBOARD_HOME: Record<Role, string> = {
  admin: "/admin",
  seller: "/seller",
  driver: "/driver",
  buyer: "/buyer",
};

export { PlusCircle };
