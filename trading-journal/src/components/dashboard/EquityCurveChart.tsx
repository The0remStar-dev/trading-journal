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
  const strokeColor = isPositive ? "#10B981" : "#EF4444";

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm text-foreground">Equity Curve</CardTitle>
      </CardHeader>
      <CardContent className="h-72 pt-0">
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3D" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v)}
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#2A2F3D" }}
                minTickGap={40}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v)}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "#151921",
                  border: "1px solid #2A2F3D",
                  borderRadius: 8,
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
                fill="url(#equityFill)"
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
      <p className="text-sm text-muted">No closed trades yet</p>
      <p className="text-xs text-muted">Log a trade to start building your equity curve.</p>
    </div>
  );
}
