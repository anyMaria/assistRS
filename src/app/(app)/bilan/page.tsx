import Link from "next/link";
import { Plus } from "lucide-react";
import { desc, eq, inArray } from "drizzle-orm";
import {
  db,
  accounts,
  publications,
  statSnapshots,
  goals,
  timeEntries,
  reports,
  monthlyRituals,
} from "@/db";
import { createGoal, deleteGoal } from "@/app/actions/goals";
import { createTimeEntry, deleteTimeEntry } from "@/app/actions/time-entries";
import { demarrerRituel } from "@/app/actions/rituel";
import { currentMonth } from "@/lib/rituel-calendar";
import { RitualWizard } from "@/components/RitualWizard";
import { FormDialog } from "@/components/FormDialog";
import { SectionHeader } from "@/components/SectionHeader";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { buildBilanData } from "@/lib/bilan";
import { latestSnapshots } from "@/lib/kpi";
import { computeGoalProgress, formatGoalValue } from "@/lib/goals";
import {
  goalMetricLabel,
  platformLabel,
  platformColor,
  formatDate,
  formatMinutes,
  formatMoney,
  GOAL_METRICS,
} from "@/lib/constants";
import { formatRate } from "@/lib/kpi";
import { deadlineMessage } from "@/lib/deadline";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
  { value: "rituel", label: "Rituel" },
] as const;

export default async function BilanPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; compte?: string }>;
}) {
  const { onglet, compte } = await searchParams;
  const activeTab = TABS.some((t) => t.value === onglet) ? onglet! : "semaine";

  return (
    <div>
      <SectionHeader
        title="Bilan"
        subtitle="Le digest hebdo, tes objectifs du mois et le rituel éditorial — tout au même endroit."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/bilan?onglet=${t.value}${compte ? `&compte=${compte}` : ""}`}
            className={`btn ${activeTab === t.value ? "bg-ink text-white" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === "semaine" && <SemaineTab />}
        {activeTab === "mois" && <MoisTab compte={compte} />}
        {activeTab === "rituel" && <RituelTab compte={compte} />}
      </div>
    </div>
  );
}

async function SemaineTab() {
  const { deadlinesSemaine, toRelaunch, toFollowUp, highlights } = await buildBilanData();

  return (
    <div>
      <section>
        <h2 className="font-display text-2xl">Deadlines de la semaine</h2>
        {deadlinesSemaine.length === 0 ? (
          <p className="mt-2 text-ink/50 italic">Rien en attente cette semaine.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {deadlinesSemaine.map(({ pub, account, deadline, status }) => (
              <li
                key={pub.id}
                className="card flex flex-wrap items-center gap-2 p-3"
                style={{
                  borderLeftWidth: 8,
                  borderLeftColor: status === "depassee" ? "var(--color-danger)" : status === "proche" ? "var(--color-warn)" : (account?.color ?? "var(--color-ink)"),
                }}
              >
                <span className="tag text-white" style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}>
                  {platformLabel(pub.platform)}
                </span>
                <span className="font-semibold">{pub.title || "Sans titre"}</span>
                <span className="text-sm text-ink/50">{account?.name}</span>
                <span
                  className={`ml-auto text-sm font-semibold ${
                    status === "depassee" ? "text-danger" : status === "proche" ? "text-warn" : "text-ink/70"
                  }`}
                >
                  {deadlineMessage(deadline)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">À relancer</h2>
        {toRelaunch.length === 0 ? (
          <p className="mt-2 text-ink/50 italic">Aucune validation en retard.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {toRelaunch.map(({ pub, account, daysSinceSent }) => (
              <li key={pub.id} className="card flex flex-wrap items-center gap-2 p-3" style={{ borderLeftWidth: 8, borderLeftColor: "var(--color-warn)" }}>
                <span className="tag text-white" style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}>
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

      <section className="mt-10">
        <h2 className="font-display text-2xl">À relever</h2>
        {toFollowUp.length === 0 ? (
          <p className="mt-2 text-ink/50 italic">Tous les relevés sont à jour.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {toFollowUp.map(({ pub, account, daysSincePublished, daysSinceLastSnapshot }) => (
              <li key={pub.id} className="card flex flex-wrap items-center gap-2 p-3">
                <span className="tag text-white" style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}>
                  {platformLabel(pub.platform)}
                </span>
                <span className="font-semibold">{pub.title || "Sans titre"}</span>
                <span className="text-sm text-ink/50">{account?.name}</span>
                <span className="ml-auto text-sm text-ink/70">
                  {daysSinceLastSnapshot === null
                    ? `Publiée il y a ${daysSincePublished} j, aucun relevé`
                    : `Dernier relevé il y a ${daysSinceLastSnapshot} j`}
                </span>
                <Link href="/mesurer" className="btn text-xs"><Plus size={13} aria-hidden /> Relever</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Stats marquantes de la semaine passée</h2>
        {highlights.length === 0 ? (
          <p className="mt-2 text-ink/50 italic">Pas de relevé marquant cette semaine.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {highlights.map(({ pub, account, snapshot, rate }) => (
              <li key={snapshot.id} className="card flex flex-wrap items-center gap-2 p-3" style={{ borderLeftWidth: 8, borderLeftColor: "var(--color-ok)" }}>
                <span className="tag text-white" style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}>
                  {platformLabel(pub.platform)}
                </span>
                <span className="font-semibold">{pub.title || "Sans titre"}</span>
                <span className="text-sm text-ink/50">{account?.name}</span>
                <span className="ml-auto text-sm font-semibold text-ok">
                  {formatRate(rate)} d&apos;engagement · {formatDate(snapshot.recordedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function MoisTab({ compte }: { compte?: string }) {
  const allAccounts = await db.select().from(accounts);
  if (allAccounts.length === 0) {
    return (
      <p className="card p-5">
        Commence par <Link href="/marques" className="font-semibold text-accent underline">créer une marque</Link>.
      </p>
    );
  }
  const accountId = compte ? Number(compte) : allAccounts[0].id;
  const account = allAccounts.find((a) => a.id === accountId) ?? allAccounts[0];

  const pubs = await db.select().from(publications).where(eq(publications.accountId, account.id));
  const pubIds = pubs.map((p) => p.id);
  const snaps = pubIds.length
    ? await db.select().from(statSnapshots).where(inArray(statSnapshots.publicationId, pubIds))
    : [];

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

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {allAccounts.map((a) => (
          <Link
            key={a.id}
            href={`/bilan?onglet=mois&compte=${a.id}`}
            className={`btn ${account.id === a.id ? "bg-ink text-white" : ""}`}
          >
            <span className="h-3 w-3 border border-current" style={{ backgroundColor: a.color }} />
            {a.name}
          </Link>
        ))}
      </div>

      {/* ——— Objectifs ——— */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Objectifs</h2>
          <FormDialog trigger={<><Plus size={15} aria-hidden /> Nouvel objectif</>} title="Nouvel objectif" triggerClassName="btn btn-accent text-sm">
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
          </FormDialog>
        </div>

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
                    <ConfirmDeleteButton action={remove} confirmMessage="Supprimer cet objectif ?" />
                  </div>
                  <div className="mt-2 h-3 w-full border border-line bg-white">
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
                  <ConfirmDeleteButton action={remove} confirmMessage="Supprimer cette saisie de temps ?" />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ——— Rapports PDF ——— */}
      <section className="mt-10">
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

const DEFAULT_ANSWERS = {
  quoiDeNeuf: "",
  promos: "",
  evenements: "",
  contraintes: "",
  nombrePublications: 8,
};

async function RituelTab({ compte }: { compte?: string }) {
  const allAccounts = await db.select().from(accounts);
  if (allAccounts.length === 0) {
    return (
      <p className="card p-8 text-center text-ink/60">
        Crée d&apos;abord une <Link href="/marques" className="font-semibold text-accent underline">marque</Link>{" "}
        pour préparer son calendrier éditorial.
      </p>
    );
  }

  const accountId = compte ? Number(compte) : allAccounts[0].id;
  const account = allAccounts.find((a) => a.id === accountId) ?? allAccounts[0];
  const month = currentMonth();

  const { id } = await demarrerRituel(account.id, month);
  const [ritual] = await db.select().from(monthlyRituals).where(eq(monthlyRituals.id, id));

  const answers = ritual?.answers ? { ...DEFAULT_ANSWERS, ...JSON.parse(ritual.answers) } : DEFAULT_ANSWERS;
  const proposal = ritual?.proposal ? JSON.parse(ritual.proposal) : [];

  return (
    <div>
      <p className="text-ink/60">
        15 minutes pour préparer le calendrier éditorial de {account.name} — {month}.
      </p>

      {allAccounts.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {allAccounts.map((a) => (
            <Link
              key={a.id}
              href={`/bilan?onglet=rituel&compte=${a.id}`}
              className={`tag ${a.id === account.id ? "bg-ink text-paper" : ""}`}
              style={a.id === account.id ? {} : { borderColor: a.color }}
            >
              {a.name}
            </Link>
          ))}
        </div>
      )}

      <RitualWizard
        ritualId={id}
        status={ritual?.status ?? "brouillon"}
        answers={answers}
        proposal={proposal}
      />
    </div>
  );
}
