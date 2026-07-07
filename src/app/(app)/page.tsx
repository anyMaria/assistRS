import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db, accounts, publications, statSnapshots, productionSteps, goals } from "@/db";
import { aggregate, formatRate, formatNumber, latestSnapshots } from "@/lib/kpi";
import {
  computeVisualDeadline,
  deadlineStatus,
  deadlineMessage,
} from "@/lib/deadline";
import { computeToRelaunch, computeToFollowUp } from "@/lib/attention";
import { computeGoalProgress, formatGoalValue } from "@/lib/goals";
import { platformLabel, platformColor, formatDate, goalMetricLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allAccounts = await db.select().from(accounts);
  const pubs = await db.select().from(publications);
  const snaps = await db.select().from(statSnapshots).orderBy(desc(statSnapshots.recordedAt));
  const latest = latestSnapshots(snaps);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const steps = pubs.length
    ? await db
        .select()
        .from(productionSteps)
        .where(inArray(productionSteps.publicationId, pubs.map((p) => p.id)))
    : [];
  const stepsByPub = new Map<number, typeof steps>();
  for (const s of steps) {
    const list = stepsByPub.get(s.publicationId) ?? [];
    list.push(s);
    stepsByPub.set(s.publicationId, list);
  }
  const toRelaunch = computeToRelaunch(pubs, stepsByPub, accountById);
  const toFollowUp = computeToFollowUp(pubs, latest, accountById);

  const now = new Date();
  const allGoals = await db.select().from(goals);
  const activeGoalsByAccount = new Map<number, typeof allGoals>();
  for (const g of allGoals) {
    if (g.periodStart > now || g.periodEnd < now) continue;
    const list = activeGoalsByAccount.get(g.accountId) ?? [];
    list.push(g);
    activeGoalsByAccount.set(g.accountId, list);
  }

  // Deadlines visuel des publications planifiées à venir
  const upcoming = pubs
    .filter((p) => p.status === "planifiee" && p.plannedAt)
    .map((p) => {
      const account = accountById.get(p.accountId);
      const deadline = computeVisualDeadline(p.plannedAt!, account?.validationDelayDays ?? 3);
      return { pub: p, account, deadline, status: deadlineStatus(deadline) };
    })
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 8);

  return (
    <div>
      <h1 className="font-display text-4xl italic">Tableau de bord</h1>
      <p className="mt-1 text-ink/60">Vue d&apos;ensemble de tes comptes et des visuels à produire.</p>

      {allAccounts.length > 0 && new Date().getDate() <= 7 && (
        <div className="card mt-6 flex flex-wrap items-center gap-3 border-accent p-4" style={{ borderColor: "var(--color-accent)" }}>
          <span aria-hidden className="text-xl">☾</span>
          <p className="flex-1">
            <span className="font-semibold">15 min pour préparer le mois</span> — le rituel mensuel
            propose un calendrier éditorial par marque.
          </p>
          <Link href="/rituel" className="btn btn-accent">Démarrer le rituel</Link>
        </div>
      )}

      {allAccounts.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <p className="font-display text-2xl italic">Bienvenue !</p>
          <p className="mt-2 text-ink/60">
            Commence par créer ton premier compte (ta marque, un client…).
          </p>
          <Link href="/comptes" className="btn btn-accent mt-5">Créer un compte</Link>
        </div>
      ) : (
        <>
          {/* À produire — rétro-planning validation client */}
          <section className="mt-8">
            <h2 className="font-display text-2xl">Visuels à produire</h2>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-ink/50 italic">
                Rien en attente — planifie une publication dans le{" "}
                <Link href="/planning" className="text-accent underline">planning</Link>.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map(({ pub, account, deadline, status }) => (
                  <li
                    key={pub.id}
                    className="card flex flex-wrap items-center gap-2 p-3"
                    style={{
                      borderLeftWidth: 8,
                      borderLeftColor:
                        status === "depassee" ? "#7A1512" : status === "proche" ? "#D97706" : (account?.color ?? "#1C1917"),
                    }}
                  >
                    <span
                      className="tag text-white"
                      style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}
                    >
                      {platformLabel(pub.platform)}
                    </span>
                    <span className="font-semibold">{pub.title || "Sans titre"}</span>
                    <span className="text-sm text-ink/50">
                      {account?.name} · publication le {formatDate(pub.plannedAt)}
                    </span>
                    <span
                      className={`ml-auto text-sm font-semibold ${
                        status === "depassee"
                          ? "text-danger"
                          : status === "proche"
                            ? "text-warn"
                            : "text-ink/70"
                      }`}
                    >
                      {deadlineMessage(deadline)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* À relancer — envoyé au client sans validation après le délai de la marque */}
          <section className="mt-10">
            <h2 className="font-display text-2xl">À relancer</h2>
            {toRelaunch.length === 0 ? (
              <p className="mt-2 text-ink/50 italic">Aucune validation en retard.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {toRelaunch.map(({ pub, account, daysSinceSent }) => (
                  <li key={pub.id} className="card flex flex-wrap items-center gap-2 p-3" style={{ borderLeftWidth: 8, borderLeftColor: "#D97706" }}>
                    <span
                      className="tag text-white"
                      style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}
                    >
                      {platformLabel(pub.platform)}
                    </span>
                    <span className="font-semibold">{pub.title || "Sans titre"}</span>
                    <span className="text-sm text-ink/50">{account?.name}</span>
                    <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-warn">
                      <span aria-hidden>⚠</span> Envoyé il y a {daysSinceSent} j sans validation
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* À relever — publications publiées sans relevé récent (J+2/J+7) */}
          <section className="mt-10">
            <h2 className="font-display text-2xl">À relever</h2>
            {toFollowUp.length === 0 ? (
              <p className="mt-2 text-ink/50 italic">Tous les relevés sont à jour.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {toFollowUp.map(({ pub, account, daysSincePublished, daysSinceLastSnapshot }) => (
                  <li key={pub.id} className="card flex flex-wrap items-center gap-2 p-3">
                    <span
                      className="tag text-white"
                      style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}
                    >
                      {platformLabel(pub.platform)}
                    </span>
                    <span className="font-semibold">{pub.title || "Sans titre"}</span>
                    <span className="text-sm text-ink/50">{account?.name}</span>
                    <span className="ml-auto text-sm text-ink/70">
                      {daysSinceLastSnapshot === null
                        ? `Publiée il y a ${daysSincePublished} j, aucun relevé`
                        : `Dernier relevé il y a ${daysSinceLastSnapshot} j`}
                    </span>
                    <Link href="/statistiques" className="btn text-xs">＋ Relever</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* KPI par compte */}
          <section className="mt-10">
            <h2 className="font-display text-2xl">Performance par compte</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {allAccounts.map((account) => {
                const accountPubIds = new Set(
                  pubs.filter((p) => p.accountId === account.id).map((p) => p.id),
                );
                const accountSnaps = [...latest.values()].filter((s) =>
                  accountPubIds.has(s.publicationId),
                );
                const agg = aggregate(accountSnaps);
                return (
                  <div key={account.id} className="card p-4" style={{ borderTopWidth: 6, borderTopColor: account.color }}>
                    <p className="font-display text-xl">{account.name}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <dt className="text-ink/50">Engagement</dt>
                        <dd className="text-2xl font-bold">{formatRate(agg.engagementRate)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink/50">Portée cumulée</dt>
                        <dd className="text-2xl font-bold">{formatNumber(agg.reach)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink/50">Abonnés gagnés</dt>
                        <dd className="font-semibold">{formatNumber(agg.followersGained)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink/50">Conversions</dt>
                        <dd className="font-semibold">{formatNumber(agg.conversions)}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-xs text-ink/40">
                      {agg.count} publication{agg.count > 1 ? "s" : ""} avec stats
                    </p>
                    {(activeGoalsByAccount.get(account.id) ?? []).map((g) => {
                      const { current, ratio } = computeGoalProgress(g, pubs, snaps);
                      return (
                        <div key={g.id} className="mt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">{goalMetricLabel(g.metric)}</span>
                            <span className="text-ink/50">
                              {formatGoalValue(g.metric, current)} / {formatGoalValue(g.metric, g.target)}
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full border border-ink bg-white">
                            <div
                              className="h-full bg-accent transition-[width] duration-500"
                              style={{ width: `${Math.round(ratio * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Raccourcis */}
          <section className="mt-10 flex flex-wrap gap-3">
            <Link href="/statistiques" className="btn">＋ Saisir des stats</Link>
            <Link href="/creation" className="btn">✎ Trouver une idée</Link>
            <Link href="/planning" className="btn">▦ Planifier</Link>
            <Link href="/analyse" className="btn btn-accent">◎ Analyser</Link>
          </section>
        </>
      )}
    </div>
  );
}
