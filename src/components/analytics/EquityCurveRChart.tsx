"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { LineChart as LineChartIcon } from "lucide-react";
import type { EquityPointR } from "@/types/analytics";

export function EquityCurveRChart({ data }: { data: EquityPointR[] }) {
  const isPositive = data.length ? data[data.length - 1].cumulativeR >= 0 : true;
  const strokeColor = isPositive ? "#059669" : "#DC2626";

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Courbe d&apos;équité (en R)</CardTitle>
      </CardHeader>
      <CardContent className="h-72 pt-0">
        {data.length === 0 ? (
          <EmptyState icon={LineChartIcon} title="Aucun trade clôturé" description="sur cette période et ces filtres." className="h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="equityRFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} minTickGap={40} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}R`} width={50} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, color: "#0F172A" }}
                labelFormatter={(v) => formatDate(v as string)}
                formatter={(value: number) => [`${value >= 0 ? "+" : ""}${value}R`, "Cumulé"]}
              />
              <Area type="monotone" dataKey="cumulativeR" stroke={strokeColor} strokeWidth={2} fill="url(#equityRFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}