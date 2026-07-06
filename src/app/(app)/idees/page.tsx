import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, ideas, accounts, viewConfigs, colorRules } from "@/db";
import { createIdea, deleteIdea, setIdeaStatus, planifierIdee, duplicateIdea } from "@/app/actions/ideas";
import { ViewTabs } from "@/components/dataviews/ViewTabs";
import { TableView } from "@/components/dataviews/TableView";
import { KanbanView } from "@/components/dataviews/KanbanView";
import { CalendarView } from "@/components/dataviews/CalendarView";
import { IdeaForm } from "@/components/IdeaForm";
import { PlanifierIdeeForm } from "@/components/PlanifierIdeeForm";
import { evaluateColor } from "@/lib/color-rules";
import type { DataCard } from "@/components/dataviews/types";
import { platformLabel, platformColor, formatLabel, ideaStatusLabel, IDEA_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function IdeesPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; mois?: string }>;
}) {
  const { vue, mois } = await searchParams;

  const views = await db.select().from(viewConfigs).where(eq(viewConfigs.entity, "idees"));
  const activeView = views.find((v) => v.id === Number(vue)) ?? views[0];

  const allAccounts = await db.select().from(accounts);
  const list = await db.select().from(ideas).orderBy(desc(ideas.createdAt));
  const rules = await db.select().from(colorRules);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const cards: DataCard[] = list.map((idea) => {
    const account = accountById.get(idea.accountId);
    const row = { status: idea.status, platform: idea.platform, format: idea.format, source: idea.source };
    return {
      id: idea.id,
      title: idea.title,
      subtitle: `${account?.name ?? "—"}${idea.theme ? ` · ${idea.theme}` : ""}`,
      badges: [
        ...(idea.platform ? [{ label: platformLabel(idea.platform), color: platformColor(idea.platform) }] : []),
        { label: formatLabel(idea.format ?? "post") },
        { label: idea.source === "ia" ? "IA" : "manuelle" },
      ],
      color: evaluateColor(rules, "idees", row),
      column: idea.status,
      date: idea.createdAt,
      extra: ideaStatusLabel(idea.status),
      body: idea.content || undefined,
    };
  });

  const month = mois ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      <h1 className="font-display text-4xl italic">Idées</h1>
      <p className="mt-1 text-ink/60">
        Bibliothèque d&apos;idées — retenues, elles deviennent des publications via « Planifier ».
      </p>

      {allAccounts.length === 0 ? (
        <p className="card mt-6 p-5">
          Commence par <Link href="/marques" className="font-semibold text-accent underline">créer une marque</Link>.
        </p>
      ) : (
        <>
          <details className="card mt-6">
            <summary className="cursor-pointer p-4 font-display text-2xl">+ Nouvelle idée</summary>
            <div className="border-t-2 border-ink p-5">
              <IdeaForm accounts={allAccounts} action={createIdea} />
            </div>
          </details>

          {views.length > 0 && activeView ? (
            <>
              <div className="mt-6">
                <ViewTabs views={views} activeId={activeView.id} basePath="/idees" />
              </div>

              {activeView.type === "table" && (
                <TableView
                  cards={cards}
                  columnLabel="Statut"
                  actions={(card) => {
                    const idea = list.find((i) => i.id === card.id)!;
                    const bindPlanifier = planifierIdee.bind(null, idea.id);
                    const bindDuplicate = duplicateIdea.bind(null, idea.id);
                    const bindDelete = deleteIdea.bind(null, idea.id);
                    return (
                      <div className="space-y-2">
                        <PlanifierIdeeForm defaultPlatform={idea.platform ?? undefined} action={bindPlanifier} />
                        <div className="flex gap-3 text-xs">
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
                  columns={IDEA_STATUSES.map((s) => ({ key: s.value, label: s.label }))}
                  cards={cards}
                  onMove={setIdeaStatus}
                />
              )}

              {activeView.type === "calendrier" && (
                <CalendarView cards={cards} month={month} basePath="/idees" />
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
