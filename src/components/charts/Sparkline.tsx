"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

/** Mini-courbe sans axes, pour les cartes KPI compactes (G11 §4). */
export function Sparkline({ data, dataKey, color = "var(--accent)" }: { data: object[]; dataKey: string; color?: string }) {
  if (data.length < 2) return null;
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
