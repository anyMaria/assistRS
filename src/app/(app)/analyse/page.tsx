import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import {
  db,
  accounts,
  publications,
  statSnapshots,
  goals,
  timeEntries,
  reports,
} from "@/db";
import { createGoal, deleteGoal } from "@/app/actions/goals";
import { createTimeEntry, deleteTimeEntry } from "@/app/actions/time-entries";
import { applyPersonalizedSlots } from "@/app/actions/timeslots";
import { latestSnapshots } from "@/lib/kpi";
import { computeGoalProgress, formatGoalValue } from "@/lib/goals";
import {
  computeRealSlots,
  countStatsForPlatform,
  MIN_PUBS_FOR_ANALYSIS,
} from "@/lib/schedule-analysis";
import {
  PLATFORMS,
  GOAL_METRICS,
  goalMetricLabel,
  platformLabel,
  formatDate,
  formatMinutes,
  formatMoney,
  DAYS_SHORT,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AnalysePage({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string }>;
}) {
  const { compte } = await searchParams;
  const allAccounts = await db.select().from(accounts);
  if (allAccounts.length === 0) {
    return (
      <div>
        <h1 className="font-display text-4xl italic">Analyse</h1>
        <p className="card mt-6 p-5">
          Commence par <Link href="/marques" className="font-semibold text-accent underline">créer une marque</Link>.
        </p>
      </div>
    );
  }
  const accountId = compte ? Number(compte) : allAccounts[0].id;
  const account = allAccounts.find((a) => a.id === accountId) ?? allAccounts[0];

  const pubs = await db.select().from(publications).where(eq(publications.accountId, account.id));
  const pubIds = pubs.map((p) => p.id);
  const snaps = pubIds.length
    ? await db.select().from(statSnapshots).where(inArray(statSnapshots.publicationId, pubIds))
    : [];
  const latest = latestSnapshots(snaps);

  const accountGoals = await db.select().from(goals).where(eq(goals.accountId, account.id)).orderBy(desc(goals.periodEnd));
  const accountEntries = await db
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.accountId, account.id))
    .orderBy(desc(timeEntries.date))
    .limit(15);
  const totalMinutes = accountEntries.reduce((sum, e) => sum + e.minutes, 0);
  const valuedCents = account.hourlyRateCents ? Math.round((totalMinutes / 60) * account.hourlyRateCents) : null;

  const accountReports = await db
    .select()
    .from(reports)
    .where(eq(reports.accountId, account.id))
    .orderBy(desc(reports.createdAt))
    .limit(6);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const activePlatforms = (JSON.parse(account.platforms) as string[]).length
    ? (JSON.parse(account.platforms) as string[])
    : PLATFORMS.map((p) => p.value);

  return (
    <div>
      <h1 className="font-display text-4xl italic">Analyse</h1>
      <p className="mt-1 text-ink/60">Objectifs, temps passé, créneaux personnalisés et rapports.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {allAccounts.map((a) => (
          <Link
            key={a.id}
            href={`/analyse?compte=${a.id}`}
            className={`btn ${account.id === a.id ? "bg-ink text-white" : ""}`}
          >
            <span className="h-3 w-3 border border-current" style={{ backgroundColor: a.color }} />
            {a.name}
          </Link>
        ))}
      </div>

      {/* ——— Objectifs ——— */}
      <section className="mt-8">
        <h2 className="font-display text-2xl">Objectifs</h2>
        <details className="card mt-3">
          <summary className="cursor-pointer p-4 font-semibold">+ Nouvel objectif</summary>
          <div className="border-t-2 border-ink p-5">
            <form action={createGoal} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="accountId" value={account.id} />
              <label>
                <span className="field-label">Métrique *</span>
                <select name="metric" required className="field">
                  {GOAL_METRICS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Cible *</span>
                <input
                  type="number"
                  name="target"
                  required
                  min={1}
                  inputMode="numeric"
                  className="field"
                  placeholder="ex : 450 pour 4,50 % d'engagement"
                />
              </label>
              <label>
                <span className="field-label">Début de période *</span>
                <input type="date" name="periodStart" required className="field" />
              </label>
              <label>
                <span className="field-label">Fin de période *</span>
                <input type="date" name="periodEnd" required className="field" />
              </label>
              <div className="md:col-span-2">
                <button type="submit" className="btn btn-accent">Créer l&apos;objectif</button>
              </div>
            </form>
          </div>
        </details>

        {accountGoals.length === 0 ? (
          <p className="mt-3 italic text-ink/50">Aucun objectif défini pour {account.name}.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {accountGoals.map((g) => {
              const { current, ratio } = computeGoalProgress(g, pubs, snaps);
              const remove = deleteGoal.bind(null, g.id);
              return (
                <li key={g.id} className="card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{goalMetricLabel(g.metric)}</span>
                    <span className="text-sm text-ink/50">
                      {formatDate(g.periodStart)} → {formatDate(g.periodEnd)}
                    </span>
                    <span className="ml-auto text-sm font-semibold">
                      {formatGoalValue(g.metric, current)} / {formatGoalValue(g.metric, g.target)}
                    </span>
                    <form action={remove}>
                      <button type="submit" className="text-xs font-semibold text-danger underline underline-offset-2">
                        Supprimer
                      </button>
                    </form>
                  </div>
                  <div className="mt-2 h-3 w-full border-2 border-ink bg-white">
                    <div
                      className="h-full bg-accent transition-[width] duration-500"
                      style={{ width: `${Math.round(ratio * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ——— Temps passé ——— */}
      <section className="mt-10">
        <h2 className="font-display text-2xl">Temps passé</h2>
        <p className="mt-1 text-sm text-ink/60">
          {formatMinutes(totalMinutes)} sur les {accountEntries.length} dernières saisies
          {valuedCents !== null ? ` — valorisé ${formatMoney(valuedCents)}` : ""}.
        </p>
        <form action={createTimeEntry} className="card mt-3 grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
          <input type="hidden" name="accountId" value={account.id} />
          <label>
            <span className="field-label">Minutes *</span>
            <input type="number" name="minutes" required min={1} inputMode="numeric" className="field" placeholder="30" />
          </label>
          <label className="col-span-2 md:col-span-2">
            <span className="field-label">Note</span>
            <input name="note" className="field" placeholder="Rédaction légendes, retouches…" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-accent w-full">Ajouter</button>
          </div>
        </form>
        {accountEntries.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {accountEntries.map((e) => {
              const remove = deleteTimeEntry.bind(null, e.id);
              return (
                <li key={e.id} className="flex items-center gap-2 border-b border-ink/10 py-1.5">
                  <span className="font-semibold">{formatMinutes(e.minutes)}</span>
                  <span className="text-ink/50">{e.note}</span>
                  <span className="ml-auto text-ink/40">{formatDate(e.date)}</span>
                  <form action={remove}>
                    <button type="submit" className="text-xs font-semibold text-danger underline underline-offset-2">
                      Supprimer
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ——— Croisement horaires ——— */}
      <section className="mt-10">
        <h2 className="font-display text-2xl">Tes heures réelles</h2>
        <p className="mt-1 text-sm text-ink/60">
          Comparaison entre tes publications qui marchent vraiment et la grille recommandée.
        </p>
        {activePlatforms.map((platform) => {
          const statsCount = countStatsForPlatform(pubs, latest, platform);
          if (statsCount < MIN_PUBS_FOR_ANALYSIS) {
            return (
              <p key={platform} className="card mt-3 p-4 text-sm text-ink/50">
                {platformLabel(platform)} : {statsCount}/{MIN_PUBS_FOR_ANALYSIS} publications avec stats — encore un peu
                de patience avant de pouvoir calculer tes vrais créneaux.
              </p>
            );
          }
          const byContentType = computeRealSlots(pubs, latest, platform);
          return (
            <div key={platform} className="card mt-3 p-4">
              <h3 className="font-display text-xl">{platformLabel(platform)}</h3>
              {[...byContentType.entries()].map(([contentType, cells]) => {
                const top = cells.filter((c) => c.count >= 2).slice(0, 8);
                if (top.length === 0) return null;
                const cellsJson = JSON.stringify(
                  top.map((c) => ({ dayOfWeek: c.dayOfWeek, hour: c.hour, strength: c.strength })),
                );
                const applyAction = applyPersonalizedSlots.bind(null, platform, contentType);
                return (
                  <div key={contentType} className="mt-3 border-t-2 border-ink/10 pt-3">
                    <p className="field-label">{contentType}</p>
                    <ul className="mt-1 flex flex-wrap gap-2 text-sm">
                      {top.map((c, i) => (
                        <li key={i} className="tag">
                          {DAYS_SHORT[c.dayOfWeek]} {c.hour}h — {(c.avgRate * 100).toFixed(1)} % ({c.count})
                        </li>
                      ))}
                    </ul>
                    <form action={applyAction} className="mt-2">
                      <input type="hidden" name="cells" value={cellsJson} />
                      <button type="submit" className="btn text-xs">
                        Mettre à jour ta grille avec tes vraies meilleures heures ?
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      {/* ——— Rapports PDF ——— */}
      <section className="mt-10 mb-10">
        <h2 className="font-display text-2xl">Rapports mensuels</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`/api/rapports/${account.id}/${prevMonth}`} target="_blank" rel="noreferrer" className="btn btn-accent">
            Générer le rapport du mois dernier
          </a>
          <a href={`/api/rapports/${account.id}/${thisMonth}`} target="_blank" rel="noreferrer" className="btn">
            Générer le rapport du mois en cours
          </a>
        </div>
        {accountReports.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-ink/60">
            {accountReports.map((r) => (
              <li key={r.id}>
                {r.month} — généré le {formatDate(r.createdAt)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
