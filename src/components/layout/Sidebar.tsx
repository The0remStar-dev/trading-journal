"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  NotebookText,
  BarChart3,
  CalendarClock,
  Trophy,
  UserCircle,
  Settings,
  Calculator,
  StickyNote,
  LogOut,
  Sparkles,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { formatBadgeCount } from "@/lib/notifications/helpers";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  /** Affiche le badge de notifications non lues. */
  showBadge?: boolean;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/feed", label: "Communauté", icon: Users },
  { href: "/feed?panel=notifications", label: "Notifications", icon: Bell, showBadge: true },
  { href: "/trades", label: "Journal", icon: NotebookText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/monthly", label: "Rétrospective Mensuelle", icon: CalendarClock },
  { href: "/profile", label: "Mon profil", icon: UserCircle },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

const TOOLS_NAV_ITEMS: NavItem[] = [
  { href: "/tools/risk-calculator", label: "Calculateur de risque", icon: Calculator },
  { href: "/tools/notes", label: "Notes", icon: StickyNote },
];

const COLLAPSE_STORAGE_KEY = "tradeshare_sidebar_collapsed";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  unreadCount: number;
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  unreadCount,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const badgeLabel = formatBadgeCount(unreadCount);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(item: NavItem) {
    // L'entrée « Notifications » est une action : la page Communauté reste l'élément actif.
    if (item.href.includes("?")) return false;
    return item.href === "/dashboard" ? pathname.startsWith("/dashboard") : pathname.startsWith(item.href);
  }

  function renderItem(item: NavItem) {
    const active = isActive(item);
    const showBadge = item.showBadge && badgeLabel;

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onMobileClose}
          title={collapsed ? item.label : undefined}
          className={cn(
            "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            collapsed && "lg:justify-center lg:px-0",
            active ? "bg-secondary text-primary" : "text-muted hover:bg-background hover:text-foreground"
          )}
        >
          {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />}
          <item.icon className="h-4 w-4 shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
          {showBadge && (
            <span
              className={cn(
                "ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white",
                collapsed && "lg:absolute lg:right-1 lg:top-0.5 lg:ml-0"
              )}
              aria-label={`${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`}
            >
              {badgeLabel}
            </span>
          )}
        </Link>
      </li>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
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
            "flex items-center border-b border-border px-4 py-4",
            collapsed ? "lg:justify-center lg:px-0" : "justify-between"
          )}
        >
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            aria-label="TradeShare — Accueil"
            className={cn("min-w-0", collapsed && "lg:hidden")}
          >
            <Image
              src="/tradeshare-logo.png"
              alt=""
              width={2168}
              height={401}
              priority
              className="h-auto w-[300px] max-w-full"
            />
          </Link>

          <Link
            href="/dashboard"
            onClick={onMobileClose}
            title="TradeShare — Accueil"
            aria-label="TradeShare — Accueil"
            className={cn("hidden shrink-0", collapsed && "lg:block")}
          >
            <Image
              src="/favicon.png"
              alt=""
              width={401}
              height={401}
              className="h-10 w-10"
            />
          </Link>

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
          <ul className="flex flex-col gap-1">{MAIN_NAV_ITEMS.map(renderItem)}</ul>

          <div className="mt-6">
            <p
              className={cn(
                "px-3 text-[10px] font-semibold uppercase tracking-wider text-muted",
                collapsed && "lg:hidden"
              )}
            >
              Mes Outils
            </p>
            <ul className="mt-2 flex flex-col gap-1">{TOOLS_NAV_ITEMS.map(renderItem)}</ul>
          </div>
        </nav>

        <div className="flex flex-col gap-3 border-t border-border p-4">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-secondary via-surface to-background p-4",
              collapsed && "lg:hidden"
            )}
          >
            <Sparkles className="h-4 w-4 text-muted" />
            <p className="mt-2 text-sm font-medium text-foreground">Un meilleur trader chaque jour.</p>
            <p className="mt-0.5 text-xs text-muted">
              Votre discipline d&apos;aujourd&apos;hui construit votre edge de demain.
            </p>
            <Link
              href="/monthly"
              onClick={onMobileClose}
              className="mt-3 inline-block text-xs font-medium text-primary hover:text-foreground hover:underline"
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