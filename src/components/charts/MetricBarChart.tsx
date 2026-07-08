"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartBox, useChartColors } from "./ChartBox";
import type { ReachPoint } from "@/lib/mesurer-charts";

/** Barres — somme d'une métrique (portée, abonnés gagnés…) par période. */
export function MetricBarChart({ data }: { data: ReachPoint[] }) {
  const { axisColor, gridColor, tooltipStyle } = useChartColors();

  if (data.length === 0) {
    return <p className="p-4 text-sm italic text-ink/50">Pas encore assez de relevés sur cette période.</p>;
  }

  return (
    <ChartBox height={260}>
      {(w) => (
        <BarChart width={w} height={260} data={data} margin={{ left: -10, right: 8, top: 8 }}>
          <CartesianGrid stroke={gridColor} />
          <XAxis dataKey="periode" stroke={axisColor} tick={{ fontSize: 12, fill: axisColor }} />
          <YAxis stroke={axisColor} tick={{ fontSize: 12, fill: axisColor }} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: gridColor }} />
          <Bar dataKey="valeur" fill="#f5352b" radius={[6, 6, 0, 0]} />
        </BarChart>
      )}
    </ChartBox>
  );
}
