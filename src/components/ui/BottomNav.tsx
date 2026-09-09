"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, NotebookText, Users, BarChart3, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/trades", label: "Journal", icon: NotebookText },
  { href: "/feed", label: "Community", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Profil", icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-surface px-2 py-2 lg:hidden">
      {ITEMS.map((item) => {
        const active = item.href === "/dashboard" ? pathname.startsWith("/dashboard") : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-14 flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px]",
              active ? "bg-secondary font-medium text-foreground" : "text-subtle"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}