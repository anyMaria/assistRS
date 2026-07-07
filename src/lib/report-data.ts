import { eq, inArray } from "drizzle-orm";
import { db, accounts, publications, statSnapshots, goals, timeEntries } from "@/db";
import type { Account, StatSnapshot } from "@/db/schema";
import { aggregate, latestSnapshots, engagementRate, type Aggregate } from "@/lib/kpi";
import { computeGoalProgress } from "@/lib/goals";

export type MonthlyReportData = {
  account: Account;
  month: string;
  monthLabel: string;
  currentAgg: Aggregate;
  previousAgg: Aggregate;
  topPublications: { title: string; platform: string; format: string; rate: number | null }[];
  goalsProgress: { metric: string; target: number; current: number; ratio: number }[];
  minutes: number;
  valuedCents: number | null;
};

function monthBounds(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

function inRange(d: Date | null, s: Date, e: Date): boolean {
  return d !== null && d >= s && d < e;
}

export async function buildMonthlyReportData(accountId: number, month: string): Promise<MonthlyReportData | null> {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (!account) return null;

  const { start, end } = monthBounds(month);
  const prevMonthDate = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const { start: prevStart, end: prevEnd } = monthBounds(prevMonth);

  const pubs = await db.select().from(publications).where(eq(publications.accountId, accountId));
  const pubIds = pubs.map((p) => p.id);
  const snaps = pubIds.length
    ? await db.select().from(statSnapshots).where(inArray(statSnapshots.publicationId, pubIds))
    : [];
  const latest = latestSnapshots(snaps);

  const currentPubs = pubs.filter((p) => inRange(p.publishedAt, start, end));
  const previousPubs = pubs.filter((p) => inRange(p.publishedAt, prevStart, prevEnd));

  const isSnapshot = (s: StatSnapshot | undefined): s is StatSnapshot => s !== undefined;
  const currentSnaps = currentPubs.map((p) => latest.get(p.id)).filter(isSnapshot);
  const previousSnaps = previousPubs.map((p) => latest.get(p.id)).filter(isSnapshot);

  const currentAgg = aggregate(currentSnaps);
  const previousAgg = aggregate(previousSnaps);

  const topPublications = currentPubs
    .map((p) => {
      const snap = latest.get(p.id);
      return {
        title: p.title || "Sans titre",
        platform: p.platform,
        format: p.format,
        rate: snap ? engagementRate(snap) : null,
      };
    })
    .filter((p) => p.rate !== null)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))
    .slice(0, 3);

  const accountGoals = await db.select().from(goals).where(eq(goals.accountId, accountId));
  const periodGoals = accountGoals.filter((g) => g.periodStart <= end && g.periodEnd >= start);
  const goalsProgress = periodGoals.map((g) => {
    const { current, ratio } = computeGoalProgress(g, pubs, snaps);
    return { metric: g.metric, target: g.target, current, ratio };
  });

  const entries = await db.select().from(timeEntries).where(eq(timeEntries.accountId, accountId));
  const minutes = entries.filter((e) => inRange(e.date, start, end)).reduce((sum, e) => sum + e.minutes, 0);
  const valuedCents = account.hourlyRateCents ? Math.round((minutes / 60) * account.hourlyRateCents) : null;

  const rawMonthLabel = start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);

  return { account, month, monthLabel, currentAgg, previousAgg, topPublications, goalsProgress, minutes, valuedCents };
}
