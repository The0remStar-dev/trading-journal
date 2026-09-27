"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskAnalysis } from "@/types/analytics";

export function RiskPanel({ risk }: { risk: RiskAnalysis }) {
  const stats = [
    {
      label: "Risque moyen",
      value: risk.avgRiskRatio !== null ? `${risk.avgRiskRatio.toFixed(2)}x` : "—",
    },
    {
      label: "Écart-type",
      value: risk.riskStdDev !== null ? `${risk.riskStdDev.toFixed(2)}` : "—",
    },
    {
      label: "Trades avec stop",
      value: String(risk.tradesWithStopData),
    },
    {
      label: "Trades sans stop",
      value: String(risk.tradesWithoutStopData),
    },
    {
      label: "R après perte",
      value:
        risk.behaviorAfterLoss?.avgRAfterLoss !== null && risk.behaviorAfterLoss?.avgRAfterLoss !== undefined
          ? `${risk.behaviorAfterLoss.avgRAfterLoss >= 0 ? "+" : ""}${risk.behaviorAfterLoss.avgRAfterLoss.toFixed(2)}R`
          : "—",
    },
    {
      label: "R après gain",
      value:
        risk.behaviorAfterLoss?.avgRAfterWin !== null && risk.behaviorAfterLoss?.avgRAfterWin !== undefined
          ? `${risk.behaviorAfterLoss.avgRAfterWin >= 0 ? "+" : ""}${risk.behaviorAfterLoss.avgRAfterWin.toFixed(2)}R`
          : "—",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Analyse du risque</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-border bg-secondary/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted">{stat.label}</p>
              <p className="mt-1 text-base font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
