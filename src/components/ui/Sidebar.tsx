"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  NotebookText,
  Users,
  BarChart3,
  Trophy,
  UserCircle,
  Calendar,
  Calculator,
  StickyNote,
  CalendarClock,
  LogOut,
  Settings,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAIN_NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/trades", label: "Journal", icon: NotebookText },
  { href: "/feed", label: "Community", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/settings", label: "Profil", icon: UserCircle },
];

const TOOLS_NAV_ITEMS = [
  { href: "/tools/economic-calendar", label: "Calendrier économique", icon: Calendar },
  { href: "/tools/risk-calculator", label: "Calculateur de risque", icon: Calculator },
  { href: "/tools/notes", label: "Notes & rappels", icon: StickyNote },
  { href: "/monthly", label: "Rétrospective mensuelle", icon: CalendarClock },
];

const COLLAPSE_STORAGE_KEY = "tradeshare_sidebar_collapsed";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  username?: string;
  avatarUrl?: string | null;
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  username,
  avatarUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/dashboard" ? pathname.startsWith("/dashboard") : pathname.startsWith(href);
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-200 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-64 lg:w-[72px]" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-border px-5 py-5",
            collapsed ? "lg:justify-center lg:px-0" : "justify-between"
          )}
        >
          <div className={cn("flex items-center gap-2", collapsed && "lg:hidden")}>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-[11px] font-bold text-white">
              T
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">TradeShare</span>
          </div>

          <span className={cn("hidden h-6 w-6 items-center justify-center rounded-md bg-foreground text-[11px] font-bold text-white", collapsed && "lg:flex")}>
            T
          </span>

          <button onClick={onMobileClose} className="text-subtle hover:text-foreground lg:hidden" aria-label="Fermer le menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-16 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-subtle shadow-card transition-colors hover:text-foreground lg:flex"
          aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {MAIN_NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "lg:justify-center lg:px-0",
                      active ? "bg-secondary text-foreground" : "text-muted hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-accent" />
                    )}
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <p className={cn("px-3 text-[10px] font-semibold uppercase tracking-wider text-subtle", collapsed && "lg:hidden")}>
              Mes Outils
            </p>
            <ul className="mt-2 flex flex-col gap-0.5">
              {TOOLS_NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        collapsed && "lg:justify-center lg:px-0",
                        active ? "bg-secondary text-foreground" : "text-muted hover:bg-secondary/60 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-accent" />
                      )}
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="flex flex-col gap-1 border-t border-border p-3">
          <div className={cn("flex items-center gap-2 rounded-md px-2 py-2", collapsed && "lg:justify-center")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-medium text-muted">{username?.[0]?.toUpperCase() ?? "?"}</span>
              )}
            </div>
            <span className={cn("truncate text-sm font-medium text-foreground", collapsed && "lg:hidden")}>
              {username ?? "Mon compte"}
            </span>
          </div>

          <Link
            href="/settings"
            onClick={onMobileClose}
            title={collapsed ? "Paramètres" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-secondary hover:text-foreground",
              collapsed && "lg:justify-center lg:px-0"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className={cn(collapsed && "lg:hidden")}>Paramètres</span>
          </Link>

          <button
            onClick={handleLogout}
            title={collapsed ? "Se déconnecter" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-secondary hover:text-loss",
              collapsed && "lg:justify-center lg:px-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            <span className={cn(collapsed && "lg:hidden")}>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setHydrated(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }

  return { collapsed: hydrated ? collapsed : false, toggle, hydrated };
}