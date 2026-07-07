import Link from "next/link";
import { DAYS_SHORT, platformColor, platformLabel } from "@/lib/constants";
import { CardModal, DetailFields } from "./CardModal";
import { HourMarker } from "./HourMarker";
import type { DataCard } from "./types";
import type { SuggestedSlot } from "@/lib/suggested-slots";

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
  displayProps = [],
  suggestedSlots,
}: {
  cards: DataCard[];
  deadlines?: CalendarDeadline[];
  /** Mois affiché, ex. "2026-07" */
  month: string;
  basePath: string;
  extraParams?: string;
  /** Propriétés à afficher sur chaque carreau (réglables dans /parametres). */
  displayProps?: string[];
  /** Overlay « Horaires conseillés » (G10), activable/désactivable depuis le planning. */
  suggestedSlots?: SuggestedSlot[];
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
          const weekday = day ? (day.getDay() + 6) % 7 : -1;
          const daySuggestions = day && suggestedSlots ? suggestedSlots.filter((s) => s.dayOfWeek === weekday) : [];
          return (
            <div
              key={i}
              className="min-h-28 border-b border-r border-ink/10 p-1.5 align-top text-xs last:border-r-0"
            >
              {day && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-ink/50">{day.getDate()}</span>
                    <div className="flex items-center gap-1">
                      {daySuggestions.map((s, idx) => (
                        <HourMarker
                          key={idx}
                          color={platformColor(s.platform)}
                          label={`${platformLabel(s.platform)} : ${s.hour}h conseillé`}
                        />
                      ))}
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
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayCards.map((c) => (
                      <CardModal
                        key={c.id}
                        title={c.title}
                        triggerClassName="border border-ink/15 bg-white p-1 hover:border-ink/40"
                        trigger={
                          <div
                            className="border-l-[3px] pl-1"
                            style={{ borderLeftColor: c.color ?? "#1C1917" }}
                          >
                            <p className="truncate font-semibold">{c.title}</p>
                            {displayProps.length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-0.5">
                                {displayProps.map((p) => {
                                  const val = c.properties?.[p];
                                  return val ? (
                                    <span key={p} className="tag !px-1 !py-0 text-[9px]">{val}</span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        }
                      >
                        <div className="mb-4 flex flex-wrap gap-1">
                          {c.badges.map((b, i) => (
                            <span
                              key={i}
                              className="tag"
                              style={b.color ? { backgroundColor: b.color, color: "white", borderColor: "transparent" } : undefined}
                            >
                              {b.label}
                            </span>
                          ))}
                        </div>
                        <DetailFields fields={c.detail ?? []} />
                      </CardModal>
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
