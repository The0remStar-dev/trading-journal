"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import type { RDistributionBucket } from "@/types/analytics";

export function RDistributionChart({ data }: { data: RDistributionBucket[] }) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Distribution des résultats (R)</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pt-0">
        {!hasData ? (
          <EmptyState icon={BarChart3} title="Aucune donnée" className="h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="bucket" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, color: "#0F172A" }}
                formatter={(value: number) => [`${value} trade(s)`, "Nombre"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.isPositive ? "#059669" : "#DC2626"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}