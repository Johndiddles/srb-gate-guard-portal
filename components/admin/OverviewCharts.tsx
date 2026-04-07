"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourBucket } from "@/lib/dashboard/overviewData";

function toChartRows(buckets: HourBucket[]) {
  return buckets.map((b) => ({
    label: `${String(b.hour).padStart(2, "0")}:00`,
    count: b.count,
  }));
}

export function HourlyBarChart({
  buckets,
  color,
  emptyLabel,
}: {
  buckets: HourBucket[];
  color: string;
  emptyLabel?: string;
}) {
  const data = toChartRows(buckets);
  const max = Math.max(1, ...data.map((d) => d.count));
  const hasActivity = data.some((d) => d.count > 0);

  if (!hasActivity && emptyLabel) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#64748b" }}
            interval={2}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            width={36}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            domain={[0, Math.ceil(max * 1.1) || 1]}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
