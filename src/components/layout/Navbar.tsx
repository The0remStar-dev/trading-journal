"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LineChart, LogOut, NotebookText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LineChart },
  { href: "/trades", label: "Trade Log", icon: NotebookText },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-win shadow-glow" />
            <span className="text-sm font-semibold tracking-wide text-foreground">
              TRADE<span className="text-win">JOURNAL</span>
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              // Évite que "/settings" ne reste actif sur une future route "/settings/xyz"
              // non prévue, tout en gérant correctement les sous-routes légitimes.
              const active =
                item.href === "/dashboard"
                  ? pathname.startsWith("/dashboard")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-surface text-foreground"
                      : "text-muted hover:text-foreground hover:bg-surface/60"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </header>
  );
}