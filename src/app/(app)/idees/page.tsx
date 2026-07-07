import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, ideas, accounts, brandEditorial, viewConfigs, colorRules } from "@/db";
import { createIdea, deleteIdea, setIdeaStatus, planifierIdee, duplicateIdea } from "@/app/actions/ideas";
import { ViewTabs } from "@/components/dataviews/ViewTabs";
import { TableView } from "@/components/dataviews/TableView";
import { KanbanView } from "@/components/dataviews/KanbanView";
import { CalendarView } from "@/components/dataviews/CalendarView";
import { IdeaForm } from "@/components/IdeaForm";
import { PlanifierIdeeForm } from "@/components/PlanifierIdeeForm";
import { LegendeEditor } from "@/components/LegendeEditor";
import { RecallCard } from "@/components/RecallCard";
import { findRecall } from "@/lib/recall";
import { evaluateColor } from "@/lib/color-rules";
import { parseViewSettings, applyViewSettings } from "@/lib/view-config";
import type { DataCard } from "@/components/dataviews/types";
import type { RuleRow } from "@/lib/color-rules";
import {
  platformLabel,
  platformColor,
  formatLabel,
  ideaStatusLabel,
  feasibilityLabel,
  feasibilityColor,
  formatDateTime,
  IDEA_STATUSES,
} from "@/lib/constants";

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
  const editorials = await db.select().from(brandEditorial);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const pillarsByAccount: Record<number, string[]> = {};
  for (const ed of editorials) {
    try {
      const pillars: { name: string }[] = JSON.parse(ed.pillars || "[]");
      pillarsByAccount[ed.accountId] = pillars.map((p) => p.name).filter(Boolean);
    } catch {
      pillarsByAccount[ed.accountId] = [];
    }
  }

  const rows: RuleRow[] = list.map((idea) => {
    const account = accountById.get(idea.accountId);
    return {
      status: idea.status,
      account: account?.name ?? "",
      platform: idea.platform,
      format: idea.format,
      pillar: idea.pillar,
      feasibility: idea.feasibility,
      source: idea.source,
    };
  });

  let cards: DataCard[] = list.map((idea, i) => {
    const account = accountById.get(idea.accountId);
    const row = rows[i];
    return {
      id: idea.id,
      title: idea.title,
      subtitle: `${account?.name ?? "—"}${idea.theme ? ` · ${idea.theme}` : ""}`,
      badges: [
        ...(idea.platform ? [{ label: platformLabel(idea.platform), color: platformColor(idea.platform) }] : []),
        { label: formatLabel(idea.format ?? "post") },
        ...(idea.pillar ? [{ label: idea.pillar }] : []),
        ...(idea.feasibility
          ? [{ label: feasibilityLabel(idea.feasibility), color: feasibilityColor(idea.feasibility) }]
          : []),
        { label: idea.source === "ia" ? "IA" : "manuelle" },
      ],
      color: evaluateColor(rules, "idees", row),
      column: idea.status,
      columnLabel: ideaStatusLabel(idea.status),
      date: idea.createdAt,
      extra: ideaStatusLabel(idea.status),
      body: idea.content || undefined,
      properties: {
        account: account?.name ?? "",
        platform: idea.platform ? platformLabel(idea.platform) : "",
        format: formatLabel(idea.format ?? "post"),
        pillar: idea.pillar ?? "",
        feasibility: idea.feasibility ? feasibilityLabel(idea.feasibility) : "",
        status: ideaStatusLabel(idea.status),
      },
      detail: [
        { label: "Marque", value: account?.name ?? "" },
        { label: "Statut", value: ideaStatusLabel(idea.status) },
        { label: "Pilier", value: idea.pillar ?? "" },
        { label: "Thème", value: idea.theme ?? "" },
        { label: "Format", value: formatLabel(idea.format ?? "post") },
        { label: "Plateforme", value: idea.platform ? platformLabel(idea.platform) : "" },
        { label: "Faisabilité", value: idea.feasibility ? feasibilityLabel(idea.feasibility) : "" },
        { label: "Source", value: idea.source === "ia" ? "IA" : "Manuelle" },
        { label: "Créée le", value: formatDateTime(idea.createdAt) },
      ],
    };
  });

  const settings = parseViewSettings(activeView?.config);
  ({ items: cards } = applyViewSettings(cards, rows, settings));

  const month = mois ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // Recall (§4.3) — calculé côté serveur, aucun appel réseau.
  const recallByIdeaId = new Map(
    await Promise.all(
      list.map(async (idea) => [idea.id, await findRecall(idea.accountId, [idea.theme, idea.pillar])] as const),
    ),
  );

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
              <IdeaForm accounts={allAccounts} pillarsByAccount={pillarsByAccount} action={createIdea} />
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
                  planningLabel="Ajout dans le planning"
                  planning={(card) => {
                    const idea = list.find((i) => i.id === card.id)!;
                    const bindPlanifier = planifierIdee.bind(null, idea.id);
                    return (
                      <PlanifierIdeeForm defaultPlatform={idea.platform ?? undefined} action={bindPlanifier} />
                    );
                  }}
                  renderExtra={(card) => {
                    const idea = list.find((i) => i.id === card.id)!;
                    const recall = recallByIdeaId.get(idea.id);
                    return (
                      <>
                        {recall && <RecallCard match={recall} />}
                        <LegendeEditor
                          kind="idee"
                          id={idea.id}
                          accountId={idea.accountId}
                          platform={idea.platform || "instagram"}
                          format={idea.format ?? "post"}
                          brief={`${idea.title}${idea.content ? `\n${idea.content}` : ""}`}
                          existingText=""
                          platformLabel={platformLabel(idea.platform || "instagram")}
                        />
                      </>
                    );
                  }}
                  actions={(card) => {
                    const idea = list.find((i) => i.id === card.id)!;
                    const bindDuplicate = duplicateIdea.bind(null, idea.id);
                    const bindDelete = deleteIdea.bind(null, idea.id);
                    return (
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
                <CalendarView
                  cards={cards}
                  month={month}
                  basePath="/idees"
                  displayProps={settings.displayProps}
                />
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
