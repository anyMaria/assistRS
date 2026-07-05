import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, accounts, publications, statSnapshots } from "@/db";
import { createPublication, deletePublication } from "@/app/actions/publications";
import { PublicationForm } from "@/components/PublicationForm";
import { SnapshotForm } from "@/components/SnapshotForm";
import { engagementRate, formatRate, formatNumber, latestSnapshots } from "@/lib/kpi";
import {
  platformLabel,
  platformColor,
  formatLabel,
  formatDateTime,
  publicationStatusLabel,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string }>;
}) {
  const { compte } = await searchParams;
  const accountId = compte ? Number(compte) : null;

  const allAccounts = await db.select().from(accounts);
  const pubs = await db
    .select()
    .from(publications)
    .where(accountId ? eq(publications.accountId, accountId) : undefined)
    .orderBy(desc(publications.publishedAt), desc(publications.plannedAt));
  const snaps = await db.select().from(statSnapshots).orderBy(desc(statSnapshots.recordedAt));
  const latest = latestSnapshots(snaps);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  return (
    <div>
      <h1 className="font-display text-4xl italic">Statistiques</h1>
      <p className="mt-1 text-ink/60">
        Saisis les stats de tes publications — plusieurs relevés possibles, les KPI se
        calculent tout seuls.
      </p>

      {allAccounts.length === 0 ? (
        <p className="card mt-6 p-5">
          Commence par <Link href="/comptes" className="font-semibold text-accent underline">créer un compte</Link>.
        </p>
      ) : (
        <>
          <details className="card mt-6">
            <summary className="cursor-pointer p-4 font-display text-2xl">
              + Nouvelle publication
            </summary>
            <div className="border-t-2 border-ink p-5">
              <PublicationForm
                accounts={allAccounts}
                action={createPublication}
                submitLabel="Ajouter la publication"
              />
            </div>
          </details>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/statistiques" className={`btn ${!accountId ? "bg-ink text-white" : ""}`}>
              Tous
            </Link>
            {allAccounts.map((a) => (
              <Link
                key={a.id}
                href={`/statistiques?compte=${a.id}`}
                className={`btn ${accountId === a.id ? "bg-ink text-white" : ""}`}
              >
                <span className="h-3 w-3 border border-current" style={{ backgroundColor: a.color }} />
                {a.name}
              </Link>
            ))}
          </div>

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
                  <div className="space-y-5 border-t-2 border-ink p-5">
                    <div>
                      <h3 className="field-label">Nouveau relevé</h3>
                      <SnapshotForm publicationId={pub.id} />
                    </div>
                    {pubSnaps.length > 0 && (
                      <div className="overflow-x-auto">
                        <h3 className="field-label">Relevés ({pubSnaps.length})</h3>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-ink text-left">
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
                    <form action={remove}>
                      <button
                        type="submit"
                        className="text-sm font-semibold text-danger underline underline-offset-2"
                      >
                        Supprimer cette publication
                      </button>
                    </form>
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
