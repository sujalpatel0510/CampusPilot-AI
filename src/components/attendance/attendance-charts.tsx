"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from "recharts";
import type { AttendanceOverview } from "@/types";

export function AttendanceBarChart({ data }: { data: AttendanceOverview }) {
  const chartData = data.subjects.map((subject) => ({
    name: subject.subjectName?.split(" ")[0] ?? subject.subjectCode ?? subject.subjectId,
    percentage: subject.percentage,
    below: subject.percentage < 75,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Attendance"]}
            contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }}
          />
          <ReferenceLine y={75} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: "75% required", fontSize: 11, position: "right", fill: "hsl(var(--warning))" }} />
          <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.below ? "hsl(var(--warning))" : "hsl(var(--primary))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttendanceAreaChart({ data }: { data: AttendanceOverview }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(243 75% 59%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(243 75% 59%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Attendance"]}
            contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }}
          />
          <ReferenceLine y={75} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: "75%", fontSize: 11, position: "right", fill: "hsl(var(--warning))" }} />
          <Area type="monotone" dataKey="percentage" stroke="hsl(243 75% 59%)" strokeWidth={2} fill="url(#attendanceFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}