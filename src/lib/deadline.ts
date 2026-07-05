/**
 * Rétro-planning de validation client :
 * deadline visuel = date de publication prévue − délai de validation du compte.
 */

const DAY_MS = 24 * 3600 * 1000;

export function computeVisualDeadline(plannedAt: Date, validationDelayDays: number): Date {
  return new Date(plannedAt.getTime() - validationDelayDays * DAY_MS);
}

export type DeadlineStatus = "depassee" | "proche" | "ok";

/** Nombre de jours (arrondi vers le bas) entre aujourd'hui et la deadline. */
export function daysUntil(deadline: Date, now: Date = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDeadline = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate(),
  );
  return Math.round((startOfDeadline.getTime() - startOfToday.getTime()) / DAY_MS);
}

export function deadlineStatus(deadline: Date, now: Date = new Date()): DeadlineStatus {
  const d = daysUntil(deadline, now);
  if (d < 0) return "depassee";
  if (d < 2) return "proche";
  return "ok";
}

export function deadlineMessage(deadline: Date, now: Date = new Date()): string {
  const d = daysUntil(deadline, now);
  const date = deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  if (d < 0) return `Visuel en retard (à envoyer avant le ${date})`;
  if (d === 0) return `Visuel à faire aujourd'hui (${date})`;
  if (d === 1) return `Visuel à faire avant demain (${date})`;
  return `Visuel à faire au plus tard le ${date}`;
}
