import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, publications, accounts, viewConfigs, colorRules, statSnapshots } from "@/db";
import {
  createPublication,
  deletePublication,
  setPublicationStatus,
  duplicatePublication,
} from "@/app/actions/publications";
import { ViewTabs } from "@/components/dataviews/ViewTabs";
import { TableView } from "@/components/dataviews/TableView";
import { KanbanView } from "@/components/dataviews/KanbanView";
import { CalendarView, type CalendarDeadline } from "@/components/dataviews/CalendarView";
import { PublicationForm } from "@/components/PublicationForm";
import { evaluateColor } from "@/lib/color-rules";
import { engagementRate, latestSnapshots } from "@/lib/kpi";
import { computeVisualDeadline, deadlineStatus, daysUntil } from "@/lib/deadline";
import type { DataCard } from "@/components/dataviews/types";
import {
  platformLabel,
  platformColor,
  formatLabel,
  publicationStatusLabel,
  formatDate,
  PUBLICATION_STATUSES,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; mois?: string }>;
}) {
  const { vue, mois } = await searchParams;

  const views = await db.select().from(viewConfigs).where(eq(viewConfigs.entity, "publications"));
  const activeView = views.find((v) => v.id === Number(vue)) ?? views[0];

  const allAccounts = await db.select().from(accounts);
  const list = await db.select().from(publications).orderBy(desc(publications.plannedAt));
  const rules = await db.select().from(colorRules);
  const snaps = await db.select().from(statSnapshots).orderBy(desc(statSnapshots.recordedAt));
  const latest = latestSnapshots(snaps);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const cards: DataCard[] = list.map((pub) => {
    const account = accountById.get(pub.accountId);
    const snap = latest.get(pub.id);
    const snapRate = snap ? engagementRate(snap) : null;
    const rate = snapRate !== null ? snapRate * 100 : null;
    const deadline =
      pub.status === "planifiee" && pub.plannedAt
        ? computeVisualDeadline(pub.plannedAt, account?.validationDelayDays ?? 3)
        : null;
    const row = {
      status: pub.status,
      platform: pub.platform,
      format: pub.format,
      deadline: deadline ? daysUntil(deadline) : null,
      engagementRate: rate,
    };
    return {
      id: pub.id,
      title: pub.title || "Sans titre",
      subtitle: `${account?.name ?? "—"} · ${formatDate(pub.plannedAt ?? pub.publishedAt)}`,
      badges: [
        { label: platformLabel(pub.platform), color: platformColor(pub.platform) },
        { label: formatLabel(pub.format) },
      ],
      color: evaluateColor(rules, "publications", row),
      column: pub.status,
      date: pub.plannedAt ?? pub.publishedAt ?? null,
      extra: deadline ? deadlineStatus(deadline) : publicationStatusLabel(pub.status),
    };
  });

  const deadlines: CalendarDeadline[] = list
    .filter((p) => p.status === "planifiee" && p.plannedAt)
    .map((p) => {
      const account = accountById.get(p.accountId);
      const deadline = computeVisualDeadline(p.plannedAt!, account?.validationDelayDays ?? 3);
      return { date: deadline, status: deadlineStatus(deadline), title: `Visuel à créer : ${p.title || "sans titre"}` };
    });

  const month = mois ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      <h1 className="font-display text-4xl italic">Planning</h1>
      <p className="mt-1 text-ink/60">Publications planifiées et publiées, toutes marques confondues.</p>

      {allAccounts.length === 0 ? (
        <p className="card mt-6 p-5">
          Commence par <Link href="/marques" className="font-semibold text-accent underline">créer une marque</Link>.
        </p>
      ) : (
        <>
          <details className="card mt-6">
            <summary className="cursor-pointer p-4 font-display text-2xl">+ Nouvelle publication</summary>
            <div className="border-t-2 border-ink p-5">
              <PublicationForm accounts={allAccounts} action={createPublication} submitLabel="Ajouter la publication" />
            </div>
          </details>

          {views.length > 0 && activeView ? (
            <>
              <div className="mt-6">
                <ViewTabs views={views} activeId={activeView.id} basePath="/planning" />
              </div>

              {activeView.type === "table" && (
                <TableView
                  cards={cards}
                  columnLabel="Statut"
                  actions={(card) => {
                    const pub = list.find((p) => p.id === card.id)!;
                    const bindStatus = setPublicationStatus.bind(
                      null,
                      pub.id,
                      pub.status === "planifiee" ? "publiee" : "planifiee",
                    );
                    const bindDuplicate = duplicatePublication.bind(null, pub.id);
                    const bindDelete = deletePublication.bind(null, pub.id);
                    return (
                      <div className="space-y-2 text-xs">
                        <form action={bindStatus}>
                          <button type="submit" className="btn px-2 py-1 text-xs">
                            {pub.status === "planifiee" ? "Marquer publiée" : "Repasser planifiée"}
                          </button>
                        </form>
                        <div className="flex gap-3">
                          <form action={bindDuplicate}>
                            <button type="submit" className="font-semibold text-ink/60 underline underline-offset-2">
                              Dupliquer
                            </button>
                          </form>
                          <form action={bindDelete}>
                            <button type="submit" className="font-semibold text-danger underline underline-offset-2">
                              Supprimer
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  }}
                />
              )}

              {activeView.type === "kanban" && (
                <KanbanView
                  columns={PUBLICATION_STATUSES.map((s) => ({ key: s.value, label: s.label }))}
                  cards={cards}
                  onMove={setPublicationStatus}
                />
              )}

              {activeView.type === "calendrier" && (
                <CalendarView cards={cards} deadlines={deadlines} month={month} basePath="/planning" />
              )}
            </>
          ) : (
            <p className="mt-6 text-ink/50 italic">
              Aucune vue configurée — crée-en une dans les{" "}
              <Link href="/parametres#vues" className="text-accent underline">paramètres</Link>.
            </p>
          )}
        </>
      )}
    </div>
  );
}
