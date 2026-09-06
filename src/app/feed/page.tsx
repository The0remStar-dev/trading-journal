"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function FeedPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">Accueil</h1>
        <p className="text-sm text-muted">Le feed social de TradeShare arrive bientôt.</p>
      </div>
      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <Sparkles className="h-6 w-6 text-win" />
          <p className="text-sm text-muted">
            Cette section affichera bientôt les publications de la communauté.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}