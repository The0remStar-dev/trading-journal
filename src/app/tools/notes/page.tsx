"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { StickyNote } from "lucide-react";

export default function NotesPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">Notes</h1>
        <p className="text-sm text-muted">Vos notes libres de trading — en cours de développement.</p>
      </div>
      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <StickyNote className="h-6 w-6 text-accent-cyan" />
          <p className="text-sm text-muted">
            Dites-moi si vous souhaitez que je développe cette fonctionnalité ensuite.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}