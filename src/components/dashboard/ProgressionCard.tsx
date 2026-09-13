"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";
import { LineChart as LineChartIcon } from "lucide-react";
import type { EquityPointR } from "@/types/analytics";
import type { PeriodPreset } from "@/types/analytics";

const RANGE_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: "7d", label: "7J" },
  { value: "30d", label: "30J" },
  { value: "90d", label: "90J" },
  { value: "year", label: "1A" },
];

interface ProgressionCardProps {
  data: EquityPointR[];
  loading: boolean;
  range: PeriodPreset;
  onRangeChange: (value: PeriodPreset) => void;
}

export function ProgressionCard({ data, loading, range, onRangeChange }: ProgressionCardProps) {
  const isPositive = data.length ? data[data.length - 1].cumulativeR >= 0 : true;
  const strokeColor = isPositive ? "#059669" : "#DC2626";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-foreground">Ta progression</CardTitle>
        <div className="flex gap-1 rounded-md bg-secondary p-1">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={range === opt.value ? "primary" : "ghost"}
              className={cn("h-7 px-2.5 text-xs", range !== opt.value && "text-muted")}
              onClick={() => onRangeChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-64 pt-0">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : data.length === 0 ? (
          <EmptyState
            icon={LineChartIcon}
            title="Pas encore de trade clôturé"
            description="Ta courbe de progression apparaîtra ici dès ton premier trade."
            className="h-full"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="progressionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} minTickGap={40} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}R`} width={44} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, color: "#0F172A" }}
                labelFormatter={(v) => formatDate(v as string)}
                formatter={(value: number) => [`${value >= 0 ? "+" : ""}${value}R`, "Cumulé"]}
              />
              <Area type="monotone" dataKey="cumulativeR" stroke={strokeColor} strokeWidth={2} fill="url(#progressionFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}