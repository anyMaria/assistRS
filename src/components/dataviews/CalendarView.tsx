import Link from "next/link";
import { DAYS_SHORT } from "@/lib/constants";
import type { DataCard } from "./types";

export type CalendarDeadline = {
  date: Date;
  status: "depassee" | "proche" | "ok";
  title: string;
};

const DEADLINE_DOT: Record<CalendarDeadline["status"], string> = {
  depassee: "#7A1512",
  proche: "#D97706",
  ok: "#3D7C47",
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Vue calendrier : grille mensuelle lundi→dimanche, navigation ?mois=YYYY-MM. */
export function CalendarView({
  cards,
  deadlines = [],
  month,
  basePath,
  extraParams = "",
}: {
  cards: DataCard[];
  deadlines?: CalendarDeadline[];
  /** Mois affiché, ex. "2026-07" */
  month: string;
  basePath: string;
  extraParams?: string;
}) {
  const [year, m] = month.split("-").map(Number);
  const first = new Date(year, m - 1, 1);
  // Lundi = 0 … dimanche = 6
  const firstWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, m, 0).getDate();

  const prevMonth = new Date(year, m - 2, 1);
  const nextMonth = new Date(year, m, 1);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, m - 1, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <Link href={`${basePath}?mois=${fmt(prevMonth)}${extraParams}`} className="btn px-3 py-1">
          ← Mois précédent
        </Link>
        <p className="font-display text-xl italic">
          {first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </p>
        <Link href={`${basePath}?mois=${fmt(nextMonth)}${extraParams}`} className="btn px-3 py-1">
          Mois suivant →
        </Link>
      </div>

      <div className="card grid grid-cols-7 overflow-hidden">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="border-b-2 border-ink bg-paper p-2 text-center text-xs font-semibold uppercase tracking-wide">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const dayCards = day ? cards.filter((c) => c.date && sameDay(c.date, day)) : [];
          const dayDeadlines = day ? deadlines.filter((d) => sameDay(d.date, day)) : [];
          return (
            <div
              key={i}
              className="min-h-24 border-b border-r border-ink/10 p-1.5 align-top text-xs last:border-r-0"
            >
              {day && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-ink/50">{day.getDate()}</span>
                    <div className="flex gap-0.5">
                      {dayDeadlines.map((d, idx) => (
                        <span
                          key={idx}
                          title={d.title}
                          aria-label={`Deadline : ${d.title}`}
                          style={{ color: DEADLINE_DOT[d.status] }}
                        >
                          ◆
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayCards.map((c) => (
                      <div key={c.id} className="flex items-center gap-1 truncate">
                        <span
                          className="h-2 w-2 shrink-0 border border-ink/40"
                          style={{ backgroundColor: c.color ?? "#1C1917" }}
                        />
                        <span className="truncate">{c.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
