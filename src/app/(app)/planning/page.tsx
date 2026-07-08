import Link from "next/link";
import { Check } from "lucide-react";
import { desc, eq, inArray } from "drizzle-orm";
import { db, publications, accounts, viewConfigs, colorRules, statSnapshots, ideas, productionSteps, recurrences, publicationAssets } from "@/db";
import {
  createPublication,
  deletePublication,
  setPublicationStatus,
  duplicatePublication,
  declinerPublication,
} from "@/app/actions/publications";
import { createRecurrence, toggleRecurrenceActive, deleteRecurrence } from "@/app/actions/recurrences";
import { generateOccurrences } from "@/lib/recurrences";
import { ViewToolbar } from "@/components/dataviews/ViewToolbar";
import { TableView } from "@/components/dataviews/TableView";
import { KanbanView } from "@/components/dataviews/KanbanView";
import { CalendarView, type CalendarDeadline } from "@/components/dataviews/CalendarView";
import { GalleryView } from "@/components/dataviews/GalleryView";
import { PublicationForm } from "@/components/PublicationForm";
import { AssetUploader } from "@/components/AssetUploader";
import { LegendeEditor } from "@/components/LegendeEditor";
import { DeclinerForm } from "@/components/DeclinerForm";
import { RecallCard } from "@/components/RecallCard";
import { ProductionChecklist } from "@/components/ProductionChecklist";
import { BufferButton } from "@/components/BufferButton";
import { EnvoyerSemaineButton, type SemaineCandidate } from "@/components/EnvoyerSemaineButton";
import { findRecall } from "@/lib/recall";
import { evaluateColor } from "@/lib/color-rules";
import type { RuleRow } from "@/lib/color-rules";
import { parseViewSettings, applyViewSettings } from "@/lib/view-config";
import { ensureDefaultView } from "@/lib/ensure-default-view";
import { getSuggestedSlots } from "@/lib/suggested-slots";
import { engagementRate, formatRate, latestSnapshots } from "@/lib/kpi";
import { computeVisualDeadline, deadlineStatus, deadlineMessage, daysUntil } from "@/lib/deadline";
import type { DataCard } from "@/components/dataviews/types";
import {
  platformLabel,
  platformColor,
  formatLabel,
  publicationStatusLabel,
  formatDate,
  formatDateTime,
  PUBLICATION_STATUSES,
  PLATFORMS,
  FORMATS,
  DAYS,
  RECURRENCE_FREQS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; mois?: string; horaires?: string }>;
}) {
  const { vue, mois, horaires } = await searchParams;
  const horairesOn = horaires === "1";

  await generateOccurrences();

  const rawViews = await db.select().from(viewConfigs).where(eq(viewConfigs.entity, "publications"));
  const views = await ensureDefaultView("publications", rawViews);
  const activeView = views.find((v) => v.id === Number(vue)) ?? views[0];
  const suggestedSlots = horairesOn ? await getSuggestedSlots() : undefined;

  const [allAccounts, allRecurrences] = await Promise.all([
    db.select().from(accounts),
    db.select().from(recurrences),
  ]);
  const list = await db.select().from(publications).orderBy(desc(publications.plannedAt));
  const rules = await db.select().from(colorRules);
  const snaps = await db.select().from(statSnapshots).orderBy(desc(statSnapshots.recordedAt));
  const latest = latestSnapshots(snaps);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const steps = list.length
    ? await db
        .select()
        .from(productionSteps)
        .where(inArray(productionSteps.publicationId, list.map((p) => p.id)))
    : [];
  const stepsByPub = new Map<number, typeof steps>();
  for (const s of steps) {
    const pubSteps = stepsByPub.get(s.publicationId) ?? [];
    pubSteps.push(s);
    stepsByPub.set(s.publicationId, pubSteps);
  }

  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const assets = list.length
    ? await db.select().from(publicationAssets).where(inArray(publicationAssets.publicationId, list.map((p) => p.id)))
    : [];
  const assetsByPub = new Map<number, typeof assets>();
  for (const a of assets) {
    const pubAssets = assetsByPub.get(a.publicationId) ?? [];
    pubAssets.push(a);
    assetsByPub.set(a.publicationId, pubAssets);
  }
  for (const pubAssets of assetsByPub.values()) pubAssets.sort((x, y) => x.position - y.position);

  const rows: RuleRow[] = list.map((pub) => {
    const account = accountById.get(pub.accountId);
    const snap = latest.get(pub.id);
    const snapRate = snap ? engagementRate(snap) : null;
    const rate = snapRate !== null ? snapRate * 100 : null;
    const deadline =
      pub.status === "planifiee" && pub.plannedAt
        ? computeVisualDeadline(pub.plannedAt, account?.validationDelayDays ?? 3)
        : null;
    return {
      status: pub.status,
      account: account?.name ?? "",
      platform: pub.platform,
      format: pub.format,
      deadline: deadline ? daysUntil(deadline) : null,
      engagementRate: rate,
    };
  });

  let cards: DataCard[] = list.map((pub, i) => {
    const account = accountById.get(pub.accountId);
    const row = rows[i];
    const snap = latest.get(pub.id);
    const snapRate = snap ? engagementRate(snap) : null;
    const deadline =
      pub.status === "planifiee" && pub.plannedAt
        ? computeVisualDeadline(pub.plannedAt, account?.validationDelayDays ?? 3)
        : null;
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
      columnLabel: publicationStatusLabel(pub.status),
      date: pub.plannedAt ?? pub.publishedAt ?? null,
      extra: deadline ? deadlineStatus(deadline) : publicationStatusLabel(pub.status),
      properties: {
        account: account?.name ?? "",
        platform: platformLabel(pub.platform),
        format: formatLabel(pub.format),
        status: publicationStatusLabel(pub.status),
      },
      visualUrl: pub.visualUrl || undefined,
      detail: [
        { label: "Marque", value: account?.name ?? "" },
        { label: "Statut", value: publicationStatusLabel(pub.status) },
        { label: "Plateforme", value: platformLabel(pub.platform) },
        { label: "Format", value: formatLabel(pub.format) },
        { label: "Publication prévue le", value: formatDateTime(pub.plannedAt) },
        { label: "Publiée le", value: formatDateTime(pub.publishedAt) },
        { label: "Deadline visuel", value: deadline ? deadlineMessage(deadline) : "" },
        { label: "Taux d'engagement", value: snapRate !== null ? formatRate(snapRate) : "" },
        { label: "Lien", value: pub.url ?? "" },
      ],
    };
  });

  const settings = parseViewSettings(activeView?.config);
  ({ items: cards } = applyViewSettings(cards, rows, settings));

  const deadlines: CalendarDeadline[] = list
    .filter((p) => p.status === "planifiee" && p.plannedAt)
    .map((p) => {
      const account = accountById.get(p.accountId);
      const deadline = computeVisualDeadline(p.plannedAt!, account?.validationDelayDays ?? 3);
      return { date: deadline, status: deadlineStatus(deadline), title: `Visuel à créer : ${p.title || "sans titre"}` };
    });

  const month = mois ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const horairesToggleParams = new URLSearchParams();
  if (vue) horairesToggleParams.set("vue", vue);
  horairesToggleParams.set("mois", month);
  horairesToggleParams.set("horaires", horairesOn ? "0" : "1");
  const horairesToggleHref = `/planning?${horairesToggleParams.toString()}`;

  // Recall (§4.3) — calculé côté serveur, aucun appel réseau.
  const linkedIdeaIds = list.map((p) => p.ideaId).filter((id): id is number => id != null);
  const linkedIdeas = linkedIdeaIds.length
    ? await db.select().from(ideas).where(inArray(ideas.id, linkedIdeaIds))
    : [];
  const ideaById = new Map(linkedIdeas.map((i) => [i.id, i]));
  const recallByPubId = new Map(
    await Promise.all(
      list.map(async (pub) => {
        const linkedIdea = pub.ideaId ? ideaById.get(pub.ideaId) : undefined;
        const match = await findRecall(pub.accountId, [linkedIdea?.theme, linkedIdea?.pillar, pub.title], pub.id);
        return [pub.id, match] as const;
      }),
    ),
  );

  const dansSeptJours = new Date();
  dansSeptJours.setDate(dansSeptJours.getDate() + 7);
  const semaineCandidates: SemaineCandidate[] = list
    .filter((p) => p.status === "planifiee" && !p.bufferPostId && p.plannedAt && p.plannedAt <= dansSeptJours)
    .map((p) => {
      const account = accountById.get(p.accountId);
      const hasVisual = (assetsByPub.get(p.id)?.length ?? 0) > 0 || Boolean(p.visualUrl);
      return {
        id: p.id,
        label: `${formatDate(p.plannedAt)} · ${account?.name ?? "—"} · ${platformLabel(p.platform)} · ${p.title || "sans titre"}`,
        platform: p.platform,
        hasVisual,
      };
    });

  return (
    <div>
      <h1 className="font-display text-4xl">Planning</h1>
      <p className="mt-1 text-ink/60">
        Publications planifiées et publiées, checklist de production et récurrences.
      </p>

      {allAccounts.length === 0 ? (
        <p className="card mt-6 p-5">
          Commence par <Link href="/marques" className="font-semibold text-accent underline">créer une marque</Link>.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <EnvoyerSemaineButton candidates={semaineCandidates} />
          </div>

          <details className="card mt-4">
            <summary className="cursor-pointer p-4 font-display text-2xl">+ Nouvelle publication</summary>
            <div className="border-t border-line p-5">
              <PublicationForm accounts={allAccounts} action={createPublication} submitLabel="Ajouter la publication" />
            </div>
          </details>

          <details className="card mt-4">
            <summary className="cursor-pointer p-4 font-display text-2xl">
              ⟳ Récurrences ({allRecurrences.length})
            </summary>
            <div className="space-y-5 border-t border-line p-5">
              <form action={createRecurrence} className="grid gap-4 md:grid-cols-3">
                <label>
                  <span className="field-label">Marque *</span>
                  <select name="accountId" required className="field">
                    {allAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Plateforme *</span>
                  <select name="platform" required className="field">
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Format *</span>
                  <select name="format" required className="field">
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </label>
                <label className="md:col-span-2">
                  <span className="field-label">Titre type *</span>
                  <input name="titlePattern" required className="field" placeholder="Post FAQ" />
                </label>
                <label>
                  <span className="field-label">Fréquence</span>
                  <select name="freq" defaultValue="hebdo" className="field">
                    {RECURRENCE_FREQS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Jour *</span>
                  <select name="dayOfWeek" required defaultValue="0" className="field">
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Heure *</span>
                  <input
                    type="number"
                    name="hour"
                    required
                    min={0}
                    max={23}
                    defaultValue={11}
                    inputMode="numeric"
                    className="field"
                  />
                </label>
                <div className="md:col-span-3">
                  <button type="submit" className="btn btn-accent">Créer la récurrence</button>
                </div>
              </form>

              {allRecurrences.length > 0 && (
                <ul className="space-y-2">
                  {allRecurrences.map((rec) => {
                    const account = accountById.get(rec.accountId);
                    const toggle = toggleRecurrenceActive.bind(null, rec.id);
                    const remove = deleteRecurrence.bind(null, rec.id);
                    return (
                      <li key={rec.id} className="flex flex-wrap items-center gap-2 border border-line p-3 text-sm">
                        <span className="tag">{platformLabel(rec.platform)}</span>
                        <span className="font-semibold">{rec.titlePattern}</span>
                        <span className="text-ink/50">
                          {account?.name} · {DAYS[rec.dayOfWeek]} {rec.hour}h ·{" "}
                          {rec.freq === "hebdo" ? "chaque semaine" : "chaque mois"}
                        </span>
                        <form action={toggle}>
                          <button type="submit" className="btn text-xs">
                            {rec.active ? "Active" : "En pause"}
                          </button>
                        </form>
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
            </div>
          </details>

          {views.length > 0 && activeView ? (
            <>
              <ViewToolbar
                entity="publications"
                basePath="/planning"
                extraParams={horairesOn ? "&horaires=1" : ""}
                views={views}
                activeView={activeView}
                rules={rules}
              />

              <div className="mt-3">
                <Link href={horairesToggleHref} className={`btn text-sm ${horairesOn ? "bg-ink text-white" : ""}`}>
                  {horairesOn ? (<><Check size={14} aria-hidden /> Horaires conseillés</>) : "Afficher les horaires conseillés"}
                </Link>
                {horairesOn && (
                  <span className="ml-2 text-xs text-ink/50">
                    Créneaux forts par plateforme (grille de Paramètres) — clique sur un point pour voir l&apos;heure.
                  </span>
                )}
              </div>

              {activeView.type === "table" && (
                <TableView
                  cards={cards}
                  columnLabel="Statut"
                  renderExtra={(card) => {
                    const pub = list.find((p) => p.id === card.id)!;
                    const recall = recallByPubId.get(pub.id);
                    const linkedIdea = pub.ideaId ? ideaById.get(pub.ideaId) : undefined;
                    return (
                      <>
                        {linkedIdea && (
                          <Link
                            href="/conception?onglet=idees"
                            className="tag mb-3 inline-flex text-accent"
                            style={{ borderColor: "var(--color-accent)" }}
                          >
                            Depuis l&apos;idée : {linkedIdea.title}
                          </Link>
                        )}
                        {recall && <RecallCard match={recall} />}
                        <div className="mt-4 border-t border-line pt-4">
                          <p className="field-label">Visuels</p>
                          <div className="mt-2">
                            {blobConfigured ? (
                              <AssetUploader publicationId={pub.id} initialAssets={assetsByPub.get(pub.id) ?? []} />
                            ) : (
                              <p className="text-xs text-ink/50">
                                <span aria-hidden>⚠</span> Configure BLOB_READ_WRITE_TOKEN pour uploader des visuels
                                (le champ URL de la publication reste utilisable).
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 border-t border-line pt-4">
                          <p className="field-label">Checklist de production</p>
                          <div className="mt-2">
                            <ProductionChecklist publicationId={pub.id} steps={stepsByPub.get(pub.id) ?? []} />
                          </div>
                        </div>
                        <LegendeEditor
                          kind="publication"
                          id={pub.id}
                          accountId={pub.accountId}
                          platform={pub.platform}
                          format={pub.format}
                          brief={pub.title ?? ""}
                          existingText={pub.caption ?? ""}
                          platformLabel={platformLabel(pub.platform)}
                        />
                        <div className="mt-4 border-t border-line pt-4">
                          <p className="field-label">Décliner ce contenu</p>
                          <div className="mt-2">
                            <DeclinerForm currentPlatform={pub.platform} action={declinerPublication.bind(null, pub.id)} />
                          </div>
                        </div>
                        {pub.status === "planifiee" && (
                          <div className="mt-4 border-t border-line pt-4">
                            <p className="field-label">Buffer</p>
                            <BufferButton publicationId={pub.id} />
                          </div>
                        )}
                      </>
                    );
                  }}
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
                <CalendarView
                  cards={cards}
                  deadlines={deadlines}
                  month={month}
                  basePath="/planning"
                  extraParams={`&horaires=${horairesOn ? "1" : "0"}`}
                  displayProps={settings.displayProps}
                  suggestedSlots={suggestedSlots}
                />
              )}

              {activeView.type === "galerie" && <GalleryView cards={cards} />}
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
