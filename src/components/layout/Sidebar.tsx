"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  NotebookText,
  CalendarClock,
  Settings,
  Calculator,
  StickyNote,
  LogOut,
  Sparkles,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation principale : reprend les onglets déjà existants dans l'app.
const MAIN_NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/feed", label: "Communauté", icon: Users },
  { href: "/trades", label: "Journal", icon: NotebookText },
  { href: "/monthly", label: "Rétrospective Mensuelle", icon: CalendarClock },
  { href: "/settings", label: "Profil & Paramètres", icon: Settings },
];

const TOOLS_NAV_ITEMS = [
  { href: "/tools/risk-calculator", label: "Calculateur de risque", icon: Calculator },
  { href: "/tools/notes", label: "Notes", icon: StickyNote },
];

const COLLAPSE_STORAGE_KEY = "tradeshare_sidebar_collapsed";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
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
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-200 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-64 lg:w-[72px]" : "w-64"
        )}
      >
        {/* En-tête : branding + bouton de rétractation (desktop uniquement) */}
        <div
          className={cn(
            "flex items-center border-b border-border px-5 py-5",
            collapsed ? "lg:justify-center lg:px-0" : "justify-between"
          )}
        >
          <div className={cn("flex flex-col", collapsed && "lg:hidden")}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-win shadow-glow" />
              <span className="text-base font-semibold tracking-wide text-foreground">
                TRADE<span className="text-win">SHARE</span>
              </span>
            </div>
            <span className="mt-0.5 text-[11px] text-muted">Progress. Together.</span>
          </div>

          <span className={cn("hidden h-2 w-2 rounded-full bg-win shadow-glow", collapsed && "lg:block")} />

          <button
            onClick={onMobileClose}
            className="text-muted hover:text-foreground lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-16 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:text-foreground lg:flex"
          aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <ul className="flex flex-col gap-1">
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
                      active
                        ? "bg-win-dim text-win"
                        : "text-muted hover:bg-background hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-win" />
                    )}
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <p
              className={cn(
                "px-3 text-[10px] font-semibold uppercase tracking-wider text-muted",
                collapsed && "lg:hidden"
              )}
            >
              Mes Outils
            </p>
            <ul className="mt-2 flex flex-col gap-1">
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
                        active
                          ? "bg-win-dim text-win"
                          : "text-muted hover:bg-background hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-win" />
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

        <div className="flex flex-col gap-3 border-t border-border p-4">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-win/20 bg-gradient-to-br from-win/10 via-surface to-accent-cyan/10 p-4",
              collapsed && "lg:hidden"
            )}
          >
            <Sparkles className="h-4 w-4 text-win" />
            <p className="mt-2 text-sm font-medium text-foreground">
              Un meilleur trader chaque jour.
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Votre discipline d'aujourd'hui construit votre edge de demain.
            </p>
            <Link
              href="/monthly"
              onClick={onMobileClose}
              className="mt-3 inline-block text-xs font-medium text-win hover:underline"
            >
              Voir ma progression →
            </Link>
          </div>

          <button
            onClick={handleLogout}
            title={collapsed ? "Se déconnecter" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-loss",
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

/** Hook partagé par AppShell pour persister l'état replié/déplié entre les pages. */
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