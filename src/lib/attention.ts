import type { Publication, Account, StatSnapshot, ProductionStep } from "@/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ToRelaunch = { pub: Publication; account?: Account; daysSinceSent: number };
export type ToFollowUp = {
  pub: Publication;
  account?: Account;
  daysSincePublished: number;
  daysSinceLastSnapshot: number | null;
};

/**
 * Publications « envoyées au client » sans validation après le délai propre à la marque.
 * Alimente le bloc « À relancer » de l'accueil et du bilan.
 */
export function computeToRelaunch(
  pubs: Publication[],
  stepsByPub: Map<number, ProductionStep[]>,
  accountById: Map<number, Account>,
  now: Date = new Date(),
): ToRelaunch[] {
  const out: ToRelaunch[] = [];
  for (const pub of pubs) {
    const steps = stepsByPub.get(pub.id) ?? [];
    const envoye = steps.find((s) => s.key === "envoye");
    const valide = steps.find((s) => s.key === "valide");
    if (!envoye?.done || !envoye.doneAt || valide?.done) continue;
    const account = accountById.get(pub.accountId);
    const delay = account?.validationDelayDays ?? 3;
    const daysSinceSent = Math.floor((now.getTime() - envoye.doneAt.getTime()) / DAY_MS);
    if (daysSinceSent > delay) out.push({ pub, account, daysSinceSent });
  }
  return out.sort((a, b) => b.daysSinceSent - a.daysSinceSent);
}

/**
 * Publications publiées depuis ≥ 2 j sans relevé, ou dont le dernier relevé date de > 7 j.
 * C'est ce qui garantit des KPI frais sans effort de mémoire (CONCEPTION.md §2.2).
 */
export function computeToFollowUp(
  pubs: Publication[],
  latestSnapshotByPub: Map<number, StatSnapshot>,
  accountById: Map<number, Account>,
  now: Date = new Date(),
): ToFollowUp[] {
  const out: ToFollowUp[] = [];
  for (const pub of pubs) {
    if (pub.status !== "publiee" || !pub.publishedAt) continue;
    const daysSincePublished = Math.floor((now.getTime() - pub.publishedAt.getTime()) / DAY_MS);
    const snap = latestSnapshotByPub.get(pub.id);
    const daysSinceLastSnapshot = snap
      ? Math.floor((now.getTime() - snap.recordedAt.getTime()) / DAY_MS)
      : null;
    const needsFollowUp =
      daysSinceLastSnapshot === null ? daysSincePublished >= 2 : daysSinceLastSnapshot > 7;
    if (needsFollowUp) {
      out.push({ pub, account: accountById.get(pub.accountId), daysSincePublished, daysSinceLastSnapshot });
    }
  }
  return out.sort((a, b) => b.daysSincePublished - a.daysSincePublished);
}
