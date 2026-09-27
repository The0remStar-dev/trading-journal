"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import type { BreakdownEntry } from "@/types/analytics";

export function DayOfWeekBarChart({ data }: { data: BreakdownEntry[] }) {
  const hasData = data.some((d) => d.totalTrades > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Performance par jour de semaine</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pt-0">
        {!hasData ? (
          <EmptyState icon={CalendarDays} title="Aucune donnée" className="h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="key" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}R`} width={44} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, color: "#0F172A" }}
                formatter={(value: number, _n, props: any) => [`${value >= 0 ? "+" : ""}${value}R (${props.payload.totalTrades} trades)`, "Total"]}
              />
              <Bar dataKey="totalR" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.totalR >= 0 ? "#059669" : "#DC2626"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}