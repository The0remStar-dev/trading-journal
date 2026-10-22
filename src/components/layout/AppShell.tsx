"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Sidebar, useSidebarCollapse } from "@/components/layout/Sidebar";
import { Header } from "@/components/ui/Header";
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
        <button
          onClick={() => setMobileOpen(true)}
          className="text-foreground"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Image
          src="/tradeshare-logo.png"
          alt="TradeShare"
          width={2168}
          height={401}
          priority
          className="h-auto w-[112px] rounded-sm"
        />
      </div>

      {/* Le padding gauche suit dynamiquement l'état de la sidebar en desktop. */}
      <main className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}