"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar, useSidebarCollapse } from "@/components/layout/Sidebar";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
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

      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="text-foreground" aria-label="Ouvrir le menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold tracking-tight text-foreground">TradeShare</span>
      </div>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:pb-6">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}