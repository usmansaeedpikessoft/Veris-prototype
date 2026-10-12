"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Tooltip as RTooltip,
} from "recharts";

const AXIS = "var(--muted-foreground)";

export function AuthorityBarChart({
  data,
}: {
  data: { authority: string; open: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="authority" tick={{ fontSize: 12, fill: AXIS }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: AXIS }} axisLine={false} tickLine={false} allowDecimals={false} />
        <RTooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Bar dataKey="open" name="Open cases" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const BUCKET_COLORS: Record<string, string> = {
  "≤30 days": "var(--danger)",
  "31–60 days": "var(--warning)",
  "61–90 days": "var(--chart-3)",
  "Expired": "var(--escalate)",
};

export function ExpiryDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={52}
          outerRadius={80}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={BUCKET_COLORS[d.name] ?? "var(--chart-2)"} />
          ))}
        </Pie>
        <RTooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
