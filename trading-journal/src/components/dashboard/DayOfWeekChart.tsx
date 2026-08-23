"use client";

import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DayPoint {
  day: string;
  winRate: number;
  total: number;
}

const BAR_COLORS = ["#10B981", "#22D3EE", "#6366F1", "#F59E0B", "#EF4444"];

export function DayOfWeekChart({ data }: { data: DayPoint[] }) {
  const chartData = data.map((d, i) => ({ ...d, fill: BAR_COLORS[i % BAR_COLORS.length] }));
  const hasData = data.some((d) => d.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-foreground">Win Rate by Day of Week</CardTitle>
      </CardHeader>
      <CardContent className="h-72 pt-0">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No closed trades yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="20%"
              outerRadius="100%"
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar background={{ fill: "#1C212C" }} dataKey="winRate" cornerRadius={6} />
              <Tooltip
                contentStyle={{
                  background: "#151921",
                  border: "1px solid #2A2F3D",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, _name, props) => [
                  `${value}% (${props.payload.total} trades)`,
                  props.payload.day,
                ]}
              />
              <Legend
                iconSize={8}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={(_value, entry: any) => (
                  <span className="text-xs text-muted">
                    {entry.payload.day} · {entry.payload.winRate}%
                  </span>
                )}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
