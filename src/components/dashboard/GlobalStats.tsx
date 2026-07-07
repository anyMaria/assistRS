import { formatNumber, formatRate } from "@/lib/kpi";

export type GlobalStatsData = {
  activeAccounts: number;
  ideasWaiting: number;
  upcomingWeek: number;
  publishedTotal: number;
  globalEngagementRate: number | null;
  globalReach: number;
};

/** Quelques statistiques globales, toutes marques confondues, en tête du tableau de bord. */
export function GlobalStats({ data }: { data: GlobalStatsData }) {
  const tiles = [
    { label: "Marques actives", value: formatNumber(data.activeAccounts) },
    { label: "Idées en attente", value: formatNumber(data.ideasWaiting) },
    { label: "À publier sous 7 jours", value: formatNumber(data.upcomingWeek) },
    { label: "Publications publiées", value: formatNumber(data.publishedTotal) },
    { label: "Engagement moyen", value: formatRate(data.globalEngagementRate) },
    { label: "Portée cumulée", value: formatNumber(data.globalReach) },
  ];

  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">Vue d&apos;ensemble</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="card p-3">
            <p className="field-label">{t.label}</p>
            <p className="mt-1 font-display text-2xl">{t.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
