"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartBox, useChartColors } from "./ChartBox";
import { PLATFORMS, platformLabel } from "@/lib/constants";
import type { EngagementPoint } from "@/lib/mesurer-charts";

/** Courbe du taux d'engagement (%) dans le temps, une ligne par plateforme présente dans les données. */
export function EngagementChart({ data }: { data: EngagementPoint[] }) {
  const { axisColor, gridColor, tooltipStyle } = useChartColors();
  const platformsPresent = PLATFORMS.filter((p) => data.some((d) => typeof d[p.value] === "number"));

  if (data.length === 0 || platformsPresent.length === 0) {
    return <p className="p-4 text-sm italic text-ink/50">Pas encore assez de relevés sur cette période.</p>;
  }

  return (
    <ChartBox height={260}>
      {(w) => (
        <LineChart width={w} height={260} data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="0" />
          <XAxis dataKey="periode" stroke={axisColor} tick={{ fontSize: 12, fill: axisColor }} />
          <YAxis stroke={axisColor} tick={{ fontSize: 12, fill: axisColor }} unit=" %" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v} %`} />
          <Legend formatter={(v: string) => platformLabel(v)} />
          {platformsPresent.map((p) => (
            <Line key={p.value} type="monotone" dataKey={p.value} name={p.value} stroke={p.color} strokeWidth={2} dot={false} connectNulls />
          ))}
        </LineChart>
      )}
    </ChartBox>
  );
}
