"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar, useSidebarCollapse } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggle}
      />

      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-foreground"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold tracking-wide text-foreground">
          TRADE<span className="text-win">SHARE</span>
        </span>
      </div>

      {/* Le padding gauche suit dynamiquement l'état de la sidebar en desktop. */}
      <main className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}