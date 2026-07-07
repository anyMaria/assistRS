import { desc, inArray } from "drizzle-orm";
import { db, accounts, publications, statSnapshots, productionSteps } from "@/db";
import type { Account, Publication, StatSnapshot } from "@/db/schema";
import { latestSnapshots, engagementRate, formatRate } from "@/lib/kpi";
import { computeVisualDeadline, deadlineStatus, deadlineMessage, daysUntil, type DeadlineStatus } from "@/lib/deadline";
import { computeToRelaunch, computeToFollowUp, type ToRelaunch, type ToFollowUp } from "@/lib/attention";
import { platformLabel, formatDate } from "@/lib/constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const HIGHLIGHTS_COUNT = 3;

export type DeadlineSemaine = {
  pub: Publication;
  account?: Account;
  deadline: Date;
  status: DeadlineStatus;
};

export type Highlight = {
  pub: Publication;
  account?: Account;
  snapshot: StatSnapshot;
  rate: number | null;
};

export type BilanData = {
  deadlinesSemaine: DeadlineSemaine[];
  toRelaunch: ToRelaunch[];
  toFollowUp: ToFollowUp[];
  highlights: Highlight[];
};

/** Assemble les données du bilan hebdo — utilisé par la page /bilan ET l'e-mail du lundi. */
export async function buildBilanData(now: Date = new Date()): Promise<BilanData> {
  const allAccounts = await db.select().from(accounts);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));
  const pubs = await db.select().from(publications);

  const steps = pubs.length
    ? await db.select().from(productionSteps).where(inArray(productionSteps.publicationId, pubs.map((p) => p.id)))
    : [];
  const stepsByPub = new Map<number, typeof steps>();
  for (const s of steps) {
    const list = stepsByPub.get(s.publicationId) ?? [];
    list.push(s);
    stepsByPub.set(s.publicationId, list);
  }

  const snaps = await db.select().from(statSnapshots).orderBy(desc(statSnapshots.recordedAt));
  const latest = latestSnapshots(snaps);

  const deadlinesSemaine: DeadlineSemaine[] = pubs
    .filter((p) => p.status === "planifiee" && p.plannedAt)
    .map((p) => {
      const account = accountById.get(p.accountId);
      const deadline = computeVisualDeadline(p.plannedAt!, account?.validationDelayDays ?? 3);
      return { pub: p, account, deadline, status: deadlineStatus(deadline, now) };
    })
    .filter((d) => daysUntil(d.deadline, now) <= 7)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  const toRelaunch = computeToRelaunch(pubs, stepsByPub, accountById, now);
  const toFollowUp = computeToFollowUp(pubs, latest, accountById, now);

  const since = new Date(now.getTime() - 7 * DAY_MS);
  const highlights: Highlight[] = snaps
    .filter((s) => s.recordedAt >= since)
    .map((s) => ({
      pub: pubs.find((p) => p.id === s.publicationId)!,
      snapshot: s,
      rate: engagementRate(s),
    }))
    .filter((h) => h.pub && h.rate !== null)
    .map((h) => ({ ...h, account: accountById.get(h.pub.accountId) }))
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))
    .slice(0, HIGHLIGHTS_COUNT);

  return { deadlinesSemaine, toRelaunch, toFollowUp, highlights };
}

/** Rendu HTML (e-mail Resend) du même contenu que la page /bilan. */
export function renderBilanHtml(data: BilanData): string {
  const section = (title: string, rows: string[], empty: string) => `
    <h2 style="font-size:15px;margin:20px 0 8px;border-bottom:2px solid #1C1917;padding-bottom:4px;">${title}</h2>
    ${rows.length ? `<ul style="margin:0;padding-left:18px;">${rows.map((r) => `<li style="margin-bottom:6px;">${r}</li>`).join("")}</ul>` : `<p style="color:#78716c;font-style:italic;margin:0;">${empty}</p>`}
  `;

  const deadlines = section(
    "Deadlines de la semaine",
    data.deadlinesSemaine.map(
      (d) =>
        `<strong>${d.pub.title || "Sans titre"}</strong> (${d.account?.name ?? ""}, ${platformLabel(d.pub.platform)}) — ${deadlineMessage(d.deadline)}`,
    ),
    "Rien en attente cette semaine.",
  );

  const relances = section(
    "À relancer",
    data.toRelaunch.map(
      (r) =>
        `<strong>${r.pub.title || "Sans titre"}</strong> (${r.account?.name ?? ""}) — envoyé il y a ${r.daysSinceSent} j sans validation`,
    ),
    "Aucune validation en retard.",
  );

  const releves = section(
    "À relever",
    data.toFollowUp.map(
      (f) =>
        `<strong>${f.pub.title || "Sans titre"}</strong> (${f.account?.name ?? ""}) — ${
          f.daysSinceLastSnapshot === null
            ? `publiée il y a ${f.daysSincePublished} j, aucun relevé`
            : `dernier relevé il y a ${f.daysSinceLastSnapshot} j`
        }`,
    ),
    "Tous les relevés sont à jour.",
  );

  const stats = section(
    "Stats marquantes de la semaine passée",
    data.highlights.map(
      (h) =>
        `<strong>${h.pub.title || "Sans titre"}</strong> (${h.account?.name ?? ""}) — ${formatRate(h.rate)} d'engagement le ${formatDate(h.snapshot.recordedAt)}`,
    ),
    "Pas de relevé marquant cette semaine.",
  );

  return `${deadlines}${relances}${releves}${stats}`;
}
