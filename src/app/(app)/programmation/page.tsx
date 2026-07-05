import Link from "next/link";
import { scheduleProvider } from "@/lib/schedule/provider";
import { cycleSlot } from "@/app/actions/timeslots";
import { PLATFORMS, CONTENT_TYPES, DAYS_SHORT, platformColor } from "@/lib/constants";

export const dynamic = "force-dynamic";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 h → 22 h

export default async function ProgrammationPage({
  searchParams,
}: {
  searchParams: Promise<{ plateforme?: string; type?: string }>;
}) {
  const params = await searchParams;
  const platform = params.plateforme ?? "instagram";
  const contentType =
    params.type ?? (platform === "linkedin" ? "post" : "post");

  const slots = await scheduleProvider.getSlots(platform, contentType);
  const byCell = new Map(slots.map((s) => [`${s.dayOfWeek}-${s.hour}`, s]));

  return (
    <div>
      <h1 className="font-display text-4xl italic">Meilleurs horaires</h1>
      <p className="mt-1 text-ink/60">
        Créneaux recommandés (études Buffer) — clique sur une case pour ajuster :
        vide → faible → bon → fort → vide. Tes ajustements priment sur les moyennes.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {PLATFORMS.map((p) => (
          <Link
            key={p.value}
            href={`/programmation?plateforme=${p.value}&type=${contentType}`}
            className="btn"
            style={
              platform === p.value
                ? { backgroundColor: p.color, color: "white", borderColor: "#1C1917" }
                : undefined
            }
          >
            {p.label}
          </Link>
        ))}
        <span className="mx-2 hidden text-ink/30 md:inline">|</span>
        {CONTENT_TYPES.filter(
          (t) => platform !== "linkedin" || t.value === "post",
        ).map((t) => (
          <Link
            key={t.value}
            href={`/programmation?plateforme=${platform}&type=${t.value}`}
            className={`btn ${contentType === t.value ? "bg-ink text-white" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="border-b-2 border-r-2 border-ink bg-paper p-2 text-left">Heure</th>
              {DAYS_SHORT.map((d) => (
                <th key={d} className="border-b-2 border-ink bg-paper p-2 font-semibold uppercase tracking-wide">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="border-r-2 border-ink/60 border-b border-ink/10 px-2 py-1 text-left font-semibold text-ink/60">
                  {hour} h
                </td>
                {DAYS_SHORT.map((_, day) => {
                  const slot = byCell.get(`${day}-${hour}`);
                  const strength = slot?.strength ?? 0;
                  const action = cycleSlot.bind(null, platform, contentType, day, hour);
                  const bg =
                    strength === 0
                      ? "transparent"
                      : `color-mix(in srgb, ${platformColor(platform)} ${strength * 30}%, white)`;
                  return (
                    <td key={day} className="border-b border-ink/10 border-l border-l-ink/10 p-0">
                      <form action={action}>
                        <button
                          type="submit"
                          title={
                            strength === 0
                              ? "Ajouter un créneau"
                              : `Force ${strength}/3${slot?.source === "personnalise" ? " (personnalisé)" : ""}`
                          }
                          className="h-8 w-full min-w-12 cursor-pointer transition hover:outline-2 hover:outline-accent"
                          style={{ backgroundColor: bg }}
                        >
                          {strength === 3 ? "★" : strength === 2 ? "●" : strength === 1 ? "·" : ""}
                          {slot?.source === "personnalise" && (
                            <span className="text-[8px] align-super">✎</span>
                          )}
                        </button>
                      </form>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink/60">
        <span>· créneau faible</span>
        <span>● bon créneau</span>
        <span>★ créneau fort</span>
        <span>✎ ajusté par toi</span>
      </div>
    </div>
  );
}
