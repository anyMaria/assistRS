import Link from "next/link";
import { formatNumber, formatRate } from "@/lib/kpi";
import { Sparkline } from "@/components/charts/Sparkline";
import { EngagementChart } from "@/components/charts/EngagementChart";
import type { TrendPoint } from "@/lib/mesurer-charts";
import type { EngagementPoint } from "@/lib/mesurer-charts";

export type GlobalStatsData = {
  activeAccounts: number;
  ideasWaiting: number;
  upcomingWeek: number;
  publishedTotal: number;
  globalEngagementRate: number | null;
  globalReach: number;
};

/** Quelques statistiques globales, toutes marques confondues, en tête du tableau de bord. */
export function GlobalStats({
  data,
  trend,
  engagementSeries,
}: {
  data: GlobalStatsData;
  trend: TrendPoint[];
  engagementSeries: EngagementPoint[];
}) {
  const tiles = [
    { label: "Marques actives", value: formatNumber(data.activeAccounts) },
    { label: "Idées en attente", value: formatNumber(data.ideasWaiting) },
    { label: "À publier sous 7 jours", value: formatNumber(data.upcomingWeek) },
    { label: "Publications publiées", value: formatNumber(data.publishedTotal) },
    {
      label: "Engagement moyen",
      value: formatRate(data.globalEngagementRate),
      sparkline: <Sparkline data={trend} dataKey="engagement" />,
    },
    {
      label: "Portée cumulée",
      value: formatNumber(data.globalReach),
      sparkline: <Sparkline data={trend} dataKey="reach" color="var(--ok)" />,
    },
  ];

  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">Vue d&apos;ensemble</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="card p-3">
            <p className="field-label">{t.label}</p>
            <p className="mt-1 font-display text-2xl">{t.value}</p>
            {"sparkline" in t && t.sparkline}
          </div>
        ))}
      </div>

      {engagementSeries.length > 0 && (
        <Link href="/mesurer" className="card card-hover mt-3 block p-4">
          <p className="field-label">Engagement — 3 derniers mois</p>
          <EngagementChart data={engagementSeries} />
        </Link>
      )}
    </section>
  );
}
