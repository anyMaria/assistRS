import Link from "next/link";
import { Plus, Link2 } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db, accounts, publications, statSnapshots } from "@/db";
import { createPublication, deletePublication, rattacherBufferPostId } from "@/app/actions/publications";
import { PublicationForm } from "@/components/PublicationForm";
import { SnapshotForm } from "@/components/SnapshotForm";
import { FormDialog } from "@/components/FormDialog";
import { SectionHeader } from "@/components/SectionHeader";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { SyncBufferButton } from "@/components/SyncBufferButton";
import { EngagementChart } from "@/components/charts/EngagementChart";
import { MetricBarChart } from "@/components/charts/MetricBarChart";
import { aggregate, engagementRate, formatRate, formatNumber, latestSnapshots } from "@/lib/kpi";
import { buildEngagementSeries, buildMetricSeries, PERIODS } from "@/lib/mesurer-charts";
import {
  PLATFORMS,
  platformLabel,
  platformColor,
  formatLabel,
  formatDateTime,
  publicationStatusLabel,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

const BAR_METRICS = [
  { value: "reach", label: "Portée" },
  { value: "followersGained", label: "Abonnés gagnés" },
] as const;

export default async function MesurerPage({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string; plateforme?: string; periode?: string; metrique?: string }>;
}) {
  const { compte, plateforme, periode, metrique } = await searchParams;
  const accountId = compte ? Number(compte) : null;
  const period = PERIODS.some((p) => p.value === periode) ? periode! : "90j";
  const barMetric = BAR_METRICS.some((m) => m.value === metrique) ? (metrique as "reach" | "followersGained") : "reach";
  const filterQs = `compte=${compte ?? ""}&plateforme=${plateforme ?? ""}`;

  const allAccounts = await db.select().from(accounts);
  const accountPubs = await db
    .select()
    .from(publications)
    .where(accountId ? eq(publications.accountId, accountId) : undefined)
    .orderBy(desc(publications.publishedAt), desc(publications.plannedAt));
  const pubs = plateforme ? accountPubs.filter((p) => p.platform === plateforme) : accountPubs;
  const snaps = await db.select().from(statSnapshots).orderBy(desc(statSnapshots.recordedAt));
  const latest = latestSnapshots(snaps);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const engagementSeries = buildEngagementSeries(pubs, snaps, period);
  const barSeries = buildMetricSeries(pubs, snaps, period, barMetric);

  // Vue d'ensemble par marque : agrégat global puis détail par plateforme.
  const overview =
    accountId !== null
      ? {
          global: aggregate(
            accountPubs.map((p) => latest.get(p.id)).filter((s): s is NonNullable<typeof s> => !!s),
          ),
          byPlatform: PLATFORMS.map((p) => ({
            platform: p,
            agg: aggregate(
              accountPubs
                .filter((pub) => pub.platform === p.value)
                .map((pub) => latest.get(pub.id))
                .filter((s): s is NonNullable<typeof s> => !!s),
            ),
          })).filter((x) => x.agg.count > 0),
        }
      : null;

  return (
    <div>
      <SectionHeader
        title="Mesurer"
        subtitle="Stats synchronisées depuis Buffer, saisie manuelle en repli."
        action={
          allAccounts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <SyncBufferButton />
              <FormDialog trigger={<><Plus size={16} aria-hidden /> Nouvelle publication</>} title="Nouvelle publication">
                <PublicationForm
                  accounts={allAccounts}
                  action={createPublication}
                  submitLabel="Ajouter la publication"
                />
              </FormDialog>
            </div>
          )
        }
      />

      {allAccounts.length === 0 ? (
        <p className="card mt-6 p-5">
          Commence par <Link href="/marques" className="font-semibold text-accent underline">créer une marque</Link>.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Link href="/mesurer" className={`btn ${!accountId ? "bg-ink text-white" : ""}`}>
                Tous
              </Link>
              {allAccounts.map((a) => (
                <Link
                  key={a.id}
                  href={`/mesurer?compte=${a.id}`}
                  className={`btn ${accountId === a.id ? "bg-ink text-white" : ""}`}
                >
                  <span className="brand-chip" style={{ backgroundColor: a.color }} />
                  {a.name}
                </Link>
              ))}
            </div>
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <Link
                  key={p.value}
                  href={`/mesurer?${filterQs}&periode=${p.value}&metrique=${barMetric}`}
                  className={`btn text-sm ${period === p.value ? "bg-ink text-white" : ""}`}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Graphiques */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <p className="field-label">Taux d&apos;engagement</p>
              <EngagementChart data={engagementSeries} />
            </div>
            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="field-label mb-0">{BAR_METRICS.find((m) => m.value === barMetric)?.label}</p>
                <div className="flex gap-1">
                  {BAR_METRICS.map((m) => (
                    <Link
                      key={m.value}
                      href={`/mesurer?${filterQs}&periode=${period}&metrique=${m.value}`}
                      className={`btn px-2 py-1 text-xs ${barMetric === m.value ? "bg-ink text-white" : ""}`}
                    >
                      {m.label}
                    </Link>
                  ))}
                </div>
              </div>
              <MetricBarChart data={barSeries} />
            </div>
          </div>

          {overview && (
            <section className="mt-6">
              <h2 className="font-display text-2xl">Vue d&apos;ensemble — {accountById.get(accountId!)?.name}</h2>
              <div className="card mt-3 p-4" style={{ borderTopWidth: 6, borderTopColor: accountById.get(accountId!)?.color }}>
                <p className="field-label">Toutes plateformes confondues</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
                  <div>
                    <dt className="text-ink/50">Engagement</dt>
                    <dd className="text-2xl font-bold">{formatRate(overview.global.engagementRate)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/50">Portée cumulée</dt>
                    <dd className="text-2xl font-bold">{formatNumber(overview.global.reach)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/50">Abonnés gagnés</dt>
                    <dd className="font-semibold">{formatNumber(overview.global.followersGained)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/50">Conversions</dt>
                    <dd className="font-semibold">{formatNumber(overview.global.conversions)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-ink/40">
                  {overview.global.count} publication{overview.global.count > 1 ? "s" : ""} avec stats
                </p>
              </div>

              {overview.byPlatform.length > 0 && (
                <>
                  <p className="field-label mt-4">Détail par plateforme</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/mesurer?compte=${accountId}`}
                      className={`btn ${!plateforme ? "bg-ink text-white" : ""}`}
                    >
                      Toutes
                    </Link>
                    {overview.byPlatform.map(({ platform, agg }) => (
                      <Link
                        key={platform.value}
                        href={`/mesurer?compte=${accountId}&plateforme=${platform.value}`}
                        className={`btn ${plateforme === platform.value ? "text-white" : ""}`}
                        style={plateforme === platform.value ? { backgroundColor: platform.color, borderColor: "var(--color-ink)" } : undefined}
                      >
                        {platform.label} · {formatRate(agg.engagementRate)}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          <section className="mt-6 space-y-4">
            {pubs.length === 0 && (
              <p className="text-ink/50 italic">Aucune publication pour l&apos;instant.</p>
            )}
            {pubs.map((pub) => {
              const snap = latest.get(pub.id);
              const rate = snap ? engagementRate(snap) : null;
              const account = accountById.get(pub.accountId);
              const remove = deletePublication.bind(null, pub.id);
              const pubSnaps = snaps.filter((s) => s.publicationId === pub.id);
              return (
                <details key={pub.id} className="card">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2 p-4">
                    <span
                      className="tag text-white"
                      style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}
                    >
                      {platformLabel(pub.platform)}
                    </span>
                    <span className="tag">{formatLabel(pub.format)}</span>
                    <span className="font-semibold">{pub.title || "Sans titre"}</span>
                    <span className="text-sm text-ink/50">
                      {account?.name} · {publicationStatusLabel(pub.status)} ·{" "}
                      {formatDateTime(pub.publishedAt ?? pub.plannedAt)}
                    </span>
                    <span className="ml-auto text-sm">
                      {pub.bufferPostId && <span className="tag mr-2 text-xs">Buffer</span>}
                      {snap ? (
                        <>
                          <strong>{formatRate(rate)}</strong> engagement ·{" "}
                          {formatNumber(snap.reach)} portée
                        </>
                      ) : (
                        <em className="text-ink/40">aucune stat</em>
                      )}
                    </span>
                  </summary>
                  <div className="space-y-5 border-t border-line p-5">
                    {pub.status === "publiee" && !pub.bufferPostId && (
                      <div>
                        <h3 className="field-label">Rattacher un post Buffer (optionnel)</h3>
                        <form action={rattacherBufferPostId.bind(null, pub.id)} className="flex flex-wrap gap-2">
                          <input
                            name="bufferPostId"
                            className="field flex-1"
                            placeholder="ID du post Buffer — pour synchroniser ses stats"
                          />
                          <button type="submit" className="btn text-sm">
                            <Link2 size={14} aria-hidden /> Rattacher
                          </button>
                        </form>
                      </div>
                    )}
                    <div>
                      <h3 className="field-label">Nouveau relevé manuel</h3>
                      <SnapshotForm publicationId={pub.id} />
                    </div>
                    {pubSnaps.length > 0 && (
                      <div className="overflow-x-auto">
                        <h3 className="field-label">Relevés ({pubSnaps.length})</h3>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-line text-left">
                              <th className="py-1 pr-3">Date</th>
                              <th className="py-1 pr-3">Impr.</th>
                              <th className="py-1 pr-3">Portée</th>
                              <th className="py-1 pr-3">J&apos;aime</th>
                              <th className="py-1 pr-3">Comm.</th>
                              <th className="py-1 pr-3">Part.</th>
                              <th className="py-1 pr-3">Enreg.</th>
                              <th className="py-1 pr-3">Clics</th>
                              <th className="py-1 pr-3">Abonnés</th>
                              <th className="py-1 pr-3">Conv.</th>
                              <th className="py-1">Engag.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pubSnaps.map((s) => (
                              <tr key={s.id} className="border-b border-ink/10">
                                <td className="py-1 pr-3">{formatDateTime(s.recordedAt)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.impressions)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.reach)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.likes)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.comments)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.shares)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.saves)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.clicks)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.followersGained)}</td>
                                <td className="py-1 pr-3">{formatNumber(s.conversions)}</td>
                                <td className="py-1 font-semibold">{formatRate(engagementRate(s))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <ConfirmDeleteButton
                      action={remove}
                      confirmMessage="Supprimer cette publication et ses relevés ?"
                      className="btn text-sm text-danger"
                    >
                      Supprimer cette publication
                    </ConfirmDeleteButton>
                  </div>
                </details>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
