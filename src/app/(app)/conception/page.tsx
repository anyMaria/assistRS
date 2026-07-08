import Link from "next/link";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import {
  db,
  accounts,
  brandEditorial,
  viewConfigs,
  colorRules,
  ideas,
  publications,
  inspirationSearches,
  inspirationItems,
  moodboards,
} from "@/db";
import { createIdea, deleteIdea, setIdeaStatus, planifierIdee, duplicateIdea } from "@/app/actions/ideas";
import { ViewToolbar } from "@/components/dataviews/ViewToolbar";
import { TableView } from "@/components/dataviews/TableView";
import { KanbanView } from "@/components/dataviews/KanbanView";
import { CalendarView } from "@/components/dataviews/CalendarView";
import { IdeaForm } from "@/components/IdeaForm";
import { PlanifierIdeeForm } from "@/components/PlanifierIdeeForm";
import { LegendeEditor } from "@/components/LegendeEditor";
import { RecallCard } from "@/components/RecallCard";
import { IdeaGeneratorForm } from "@/components/IdeaGeneratorForm";
import { FormatsReference } from "@/components/FormatsReference";
import { SearchForm } from "@/components/inspiration/SearchForm";
import { BudgetBar } from "@/components/inspiration/BudgetBar";
import { PollStatus } from "@/components/inspiration/PollStatus";
import { RelancerButton } from "@/components/inspiration/RelancerButton";
import { ResultsGrid } from "@/components/inspiration/ResultsGrid";
import { rattraperRecherchesBloquees } from "@/lib/inspiration-ingest";
import { findRecall } from "@/lib/recall";
import { evaluateColor } from "@/lib/color-rules";
import { parseViewSettings, applyViewSettings } from "@/lib/view-config";
import { ensureDefaultView } from "@/lib/ensure-default-view";
import { monthlySpendCents } from "@/lib/api-usage";
import { ACTORS, type ApifySource } from "@/lib/apify";
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

const TABS = [
  { value: "creer", label: "Créer" },
  { value: "inspirer", label: "S'inspirer" },
  { value: "idees", label: "Idées" },
] as const;

export default async function ConceptionPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; vue?: string; mois?: string; recherche?: string }>;
}) {
  const params = await searchParams;
  const activeTab = TABS.some((t) => t.value === params.onglet) ? params.onglet! : "creer";

  return (
    <div>
      <h1 className="font-display text-4xl italic">Conception</h1>
      <p className="mt-1 text-ink/60">Créer des idées, s&apos;inspirer et gérer la bibliothèque d&apos;idées.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.value} href={`/conception?onglet=${t.value}`} className={`btn ${activeTab === t.value ? "bg-ink text-white" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === "creer" && <CreerTab />}
        {activeTab === "inspirer" && <InspirerTab recherche={params.recherche} />}
        {activeTab === "idees" && <IdeesTab vue={params.vue} mois={params.mois} />}
      </div>
    </div>
  );
}

async function CreerTab() {
  const allAccounts = await db.select().from(accounts);
  return (
    <div>
      <p className="text-ink/60">
        Génère 3 à 5 idées de publication avec l&apos;IA, nourries par le profil de la marque.
        <FormatsReference />
      </p>

      {allAccounts.length === 0 ? (
        <p className="card mt-6 p-5">
          Commence par <Link href="/marques" className="font-semibold text-accent underline">créer une marque</Link>.
        </p>
      ) : (
        <div className="mt-6">
          <IdeaGeneratorForm accounts={allAccounts} />
        </div>
      )}

      <p className="mt-8 text-sm text-ink/50">
        Les idées retenues rejoignent l&apos;onglet{" "}
        <Link href="/conception?onglet=idees" className="text-accent underline">Idées</Link>.
      </p>
    </div>
  );
}

async function InspirerTab({ recherche }: { recherche?: string }) {
  // Rattrapage des recherches "en_cours" bloquées (> 10 min, page fermée avant la fin) —
  // tâche de fond non bloquante, ne retarde pas le rendu de la page (G13).
  void rattraperRecherchesBloquees().catch((e) => console.error("[apify] rattrapage échoué", e));

  const ids = (recherche ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  const [allAccounts, allMoodboards, spend] = await Promise.all([
    db.select().from(accounts),
    db.select().from(moodboards),
    monthlySpendCents("apify"),
  ]);

  const accountById = new Map(allAccounts.map((a) => [a.id, a]));
  const since14j = new Date();
  since14j.setDate(since14j.getDate() - 14);
  const suggestions = await db
    .select()
    .from(inspirationSearches)
    .where(
      and(
        eq(inspirationSearches.origin, "cron"),
        eq(inspirationSearches.status, "termine"),
        gte(inspirationSearches.createdAt, since14j),
      ),
    )
    .orderBy(desc(inspirationSearches.createdAt));
  const suggestionCounts = suggestions.length
    ? await db.select().from(inspirationItems).where(inArray(inspirationItems.searchId, suggestions.map((s) => s.id)))
    : [];
  const countBySearch = new Map<number, number>();
  for (const it of suggestionCounts) countBySearch.set(it.searchId, (countBySearch.get(it.searchId) ?? 0) + 1);

  const searches = ids.length
    ? await db.select().from(inspirationSearches).where(inArray(inspirationSearches.id, ids)).orderBy(desc(inspirationSearches.createdAt))
    : [];
  const items = searches.length
    ? await db.select().from(inspirationItems).where(inArray(inspirationItems.searchId, searches.map((s) => s.id)))
    : [];
  const itemsBySearch = new Map<number, typeof items>();
  for (const it of items) {
    const list = itemsBySearch.get(it.searchId) ?? [];
    list.push(it);
    itemsBySearch.set(it.searchId, list);
  }

  return (
    <div>
      <p className="text-ink/60">
        Recherche visuelle par thème — Pinterest, Instagram, LinkedIn, Facebook, Meta Ad Library.
      </p>

      <div className="mt-6 grid items-start gap-4 md:grid-cols-[2fr_1fr]">
        <SearchForm accounts={allAccounts} defaultTheme={searches[0]?.theme ?? ""} />
        <BudgetBar spendCents={spend} />
      </div>

      <div className="mt-4">
        <Link href="/s-inspirer/moodboards" className="text-sm font-semibold text-accent underline underline-offset-2">
          Voir les moodboards →
        </Link>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-6">
          <p className="field-label">Suggestions de la semaine</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const account = s.accountId ? accountById.get(s.accountId) : undefined;
              const n = countBySearch.get(s.id) ?? 0;
              const ids = new Set((recherche ?? "").split(",").filter(Boolean));
              ids.add(String(s.id));
              return (
                <Link
                  key={s.id}
                  href={`/conception?onglet=inspirer&recherche=${Array.from(ids).join(",")}`}
                  className="tag hover:bg-ink hover:text-white"
                >
                  {s.theme} · {account?.name ?? "toutes marques"} · {n} visuels
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {searches.length === 0 ? (
        <p className="card mt-8 p-6 text-ink/60">
          Lance ta première recherche : choisis un thème et au moins une source ci-dessus.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {searches.map((search) => {
            const meta = ACTORS[search.source as ApifySource];
            const searchItems = itemsBySearch.get(search.id) ?? [];
            const boardsForSearch = search.accountId
              ? allMoodboards.filter((m) => m.accountId === search.accountId || m.accountId === null)
              : allMoodboards;
            return (
              <section key={search.id} className="card">
                <header className="flex flex-wrap items-center gap-3 border-b-2 border-ink p-4">
                  <span className="tag">{meta.label}</span>
                  <span className="font-semibold">{search.theme}</span>
                  {search.status === "termine" && searchItems.length > 0 && (
                    <span className="text-sm text-ink/50">
                      {searchItems.length} résultats · {formatDateTime(search.createdAt)}
                      {search.costCents === 0 ? " (cache gratuit)" : ` · ${(search.costCents / 100).toFixed(2)} $`}
                      {search.queryUsed && ` · recherché : « ${search.queryUsed} »`}
                    </span>
                  )}
                  <div className="ml-auto">
                    <RelancerButton searchId={search.id} />
                  </div>
                </header>

                {search.status === "en_cours" && <PollStatus searchId={search.id} />}

                {search.status === "erreur" && (
                  <div className="card p-4" style={{ borderColor: "var(--color-danger)" }}>
                    <p className="flex items-center gap-2 font-semibold text-danger">
                      <span aria-hidden>⚠</span> {search.errorMessage ?? "La recherche a échoué."}
                    </p>
                  </div>
                )}

                {search.status === "termine" && searchItems.length === 0 && (
                  <p className="p-4 text-sm italic text-ink/50">{search.errorMessage ?? "Aucun résultat."}</p>
                )}

                {search.status === "termine" && searchItems.length > 0 && (
                  <ResultsGrid items={searchItems} moodboards={boardsForSearch} accountId={search.accountId} theme={search.theme} />
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function IdeesTab({ vue, mois }: { vue?: string; mois?: string }) {
  const rawViews = await db.select().from(viewConfigs).where(eq(viewConfigs.entity, "idees"));
  const views = await ensureDefaultView("idees", rawViews);
  const activeView = views.find((v) => v.id === Number(vue)) ?? views[0];

  const allAccounts = await db.select().from(accounts);
  const list = await db.select().from(ideas).orderBy(desc(ideas.createdAt));
  const rules = await db.select().from(colorRules);
  const editorials = await db.select().from(brandEditorial);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const ideaIds = list.map((i) => i.id);
  const linkedPubs = ideaIds.length
    ? await db.select().from(publications).where(inArray(publications.ideaId, ideaIds))
    : [];
  const pubByIdeaId = new Map(linkedPubs.map((p) => [p.ideaId!, p]));

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
        ...(idea.feasibility ? [{ label: feasibilityLabel(idea.feasibility), color: feasibilityColor(idea.feasibility) }] : []),
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

  const recallByIdeaId = new Map(
    await Promise.all(
      list.map(async (idea) => [idea.id, await findRecall(idea.accountId, [idea.theme, idea.pillar])] as const),
    ),
  );

  return (
    <div>
      <p className="text-ink/60">Bibliothèque d&apos;idées — retenues, elles deviennent des publications via « Planifier ».</p>

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

          <ViewToolbar entity="idees" basePath="/conception" extraParams="&onglet=idees" views={views} activeView={activeView} rules={rules} />

          {activeView.type === "table" && (
            <TableView
              cards={cards}
              columnLabel="Statut"
              planningLabel="Ajout dans le planning"
              planning={(card) => {
                const idea = list.find((i) => i.id === card.id)!;
                const linkedPub = pubByIdeaId.get(idea.id);
                if (linkedPub) {
                  return (
                    <Link href="/planning" className="text-xs font-semibold text-accent underline underline-offset-2">
                      → Voir la publication
                    </Link>
                  );
                }
                const bindPlanifier = planifierIdee.bind(null, idea.id);
                return <PlanifierIdeeForm defaultPlatform={idea.platform ?? undefined} action={bindPlanifier} />;
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
                      <button type="submit" className="font-semibold text-ink/60 underline underline-offset-2">Dupliquer</button>
                    </form>
                    <form action={bindDelete}>
                      <button type="submit" className="font-semibold text-danger underline underline-offset-2">Supprimer</button>
                    </form>
                  </div>
                );
              }}
            />
          )}

          {activeView.type === "kanban" && (
            <KanbanView columns={IDEA_STATUSES.map((s) => ({ key: s.value, label: s.label }))} cards={cards} onMove={setIdeaStatus} />
          )}

          {activeView.type === "calendrier" && (
            <CalendarView cards={cards} month={month} basePath="/conception" extraParams="&onglet=idees" displayProps={settings.displayProps} />
          )}
        </>
      )}
    </div>
  );
}
