"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface EquityPoint {
  date: string;
  cumulativePnl: number;
  tradePnl: number;
}

export function EquityCurveChart({ data }: { data: EquityPoint[] }) {
  const isPositive = data.length ? data[data.length - 1].cumulativePnl >= 0 : true;
  const strokeColor = isPositive ? "#059669" : "#DC2626";

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm text-foreground">Courbe de capital</CardTitle>
      </CardHeader>
      <CardContent className="h-72 pt-0">
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v)}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                minTickGap={40}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v)}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelFormatter={(v) => formatDate(v as string)}
                formatter={(value: number) => [formatCurrency(value), "Cumulative PnL"]}
              />
              <Area
                type="monotone"
                dataKey="cumulativePnl"
                stroke={strokeColor}
                strokeWidth={2}
                fill={strokeColor}
                fillOpacity={0.08}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
      <p className="text-sm text-muted">Aucun trade clôturé</p>
      <p className="text-xs text-muted">Ajoutez un trade pour construire votre courbe.</p>
    </div>
  );
}
