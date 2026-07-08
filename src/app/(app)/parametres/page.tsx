import { headers } from "next/headers";
import { Pencil, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { isNull, desc } from "drizzle-orm";
import { db, icalTokens } from "@/db";
import { genererTokenIcal, revoquerTokenIcal } from "@/app/actions/ical";
import { cycleSlot } from "@/app/actions/timeslots";
import { scheduleProvider } from "@/lib/schedule/provider";
import { PLATFORMS, CONTENT_TYPES, DAYS_SHORT, platformColor } from "@/lib/constants";
import { formatDateTime } from "@/lib/constants";

export const dynamic = "force-dynamic";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 h → 22 h

const INTEGRATIONS = [
  { label: "Gemini (IA)", key: "GEMINI_API_KEY", configured: !!process.env.GEMINI_API_KEY },
  { label: "Apify (S'inspirer)", key: "APIFY_TOKEN", configured: !!process.env.APIFY_TOKEN },
  { label: "Resend (e-mails)", key: "RESEND_API_KEY", configured: !!process.env.RESEND_API_KEY },
  { label: "Vercel Blob (fichiers)", key: "BLOB_READ_WRITE_TOKEN", configured: !!process.env.BLOB_READ_WRITE_TOKEN },
  { label: "Buffer (publication)", key: "BUFFER_ACCESS_TOKEN", configured: !!process.env.BUFFER_ACCESS_TOKEN },
] as const;

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ plateforme?: string; type?: string }>;
}) {
  const [activeToken] = await db.select().from(icalTokens).where(isNull(icalTokens.revokedAt));
  const historique = await db.select().from(icalTokens).orderBy(desc(icalTokens.createdAt)).limit(5);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const params = await searchParams;
  const platform = params.plateforme ?? "instagram";
  const contentType = params.type ?? "post";
  const slots = await scheduleProvider.getSlots(platform, contentType);
  const byCell = new Map(slots.map((s) => [`${s.dayOfWeek}-${s.hour}`, s]));

  return (
    <div>
      <h1 className="font-display text-4xl">Paramètres</h1>
      <p className="mt-1 text-ink/60">Horaires de publication, intégrations et export iCal.</p>

      {/* ——— Horaires de publication ——— */}
      <section id="horaires" className="mt-8 scroll-mt-6">
        <h2 className="font-display text-2xl">Horaires de publication</h2>
        <p className="mt-1 text-sm text-ink/60">
          Créneaux recommandés (études Buffer) — clique sur une case pour ajuster :
          vide → faible → bon → fort → vide. Tes ajustements priment sur les moyennes.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {PLATFORMS.map((p) => (
            <a
              key={p.value}
              href={`/parametres?plateforme=${p.value}&type=${contentType}#horaires`}
              className="btn"
              style={
                platform === p.value
                  ? { backgroundColor: p.color, color: "white", borderColor: "var(--color-ink)" }
                  : undefined
              }
            >
              {p.label}
            </a>
          ))}
          <span className="mx-2 hidden text-ink/30 md:inline">|</span>
          {CONTENT_TYPES.filter(
            (t) => platform !== "linkedin" || t.value === "post",
          ).map((t) => (
            <a
              key={t.value}
              href={`/parametres?plateforme=${platform}&type=${t.value}#horaires`}
              className={`btn ${contentType === t.value ? "bg-ink text-white" : ""}`}
            >
              {t.label}
            </a>
          ))}
        </div>

        <div className="card mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="border-b-2 border-r border-line bg-paper p-2 text-left">Heure</th>
                {DAYS_SHORT.map((d) => (
                  <th key={d} className="border-b border-line bg-paper p-2 font-semibold uppercase tracking-wide">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="border-r border-line border-b border-ink/10 px-2 py-1 text-left font-semibold text-ink/60">
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
                            className="relative h-8 w-full min-w-12 cursor-pointer transition hover:outline-2 hover:outline-accent"
                            style={{ backgroundColor: bg }}
                          >
                            {strength === 3 ? "★" : strength === 2 ? "●" : strength === 1 ? "·" : ""}
                            {slot?.source === "personnalise" && (
                              <Pencil size={8} aria-hidden className="absolute -right-0.5 -top-0.5" />
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
          <span className="inline-flex items-center gap-1"><Pencil size={10} aria-hidden /> ajusté par toi</span>
        </div>
      </section>

      {/* ——— Intégrations ——— */}
      <section id="integrations" className="mt-10 scroll-mt-6">
        <h2 className="font-display text-2xl">Intégrations</h2>
        <p className="mt-1 text-sm text-ink/50">
          État des clés côté serveur, en lecture seule — les valeurs ne sont jamais affichées ici.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {INTEGRATIONS.map((i) => (
            <li key={i.key} className="card flex items-center justify-between gap-2 p-3">
              <span className="font-semibold">{i.label}</span>
              <span
                className={`tag ${i.configured ? "text-ok" : "text-danger"}`}
                style={{ borderColor: i.configured ? "var(--color-ok)" : "var(--color-danger)" }}
              >
                {i.configured ? (<><Check size={11} aria-hidden /> configurée</>) : (<><AlertTriangle size={11} aria-hidden /> manquante</>)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ——— Export iCal ——— */}
      <section id="ical" className="mt-10 scroll-mt-6">
        <h2 className="font-display text-2xl">Export iCal</h2>
        <p className="mt-1 text-sm text-ink/60">
          Abonne Google Calendar ou ton iPhone aux deadlines visuel et aux dates de publication.
          Le lien est secret : ne le partage qu&apos;avec toi-même.
        </p>

        {activeToken ? (
          <div className="mt-4 space-y-3">
            <label>
              <span className="field-label">URL d&apos;abonnement</span>
              <input
                readOnly
                defaultValue={`${origin}/api/ical/${activeToken.token}`}
                className="field font-mono text-sm"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <form action={genererTokenIcal}>
                <button type="submit" className="btn text-sm"><RefreshCw size={14} aria-hidden /> Régénérer (révoque l&apos;ancien lien)</button>
              </form>
              <form action={revoquerTokenIcal.bind(null, activeToken.id)}>
                <button type="submit" className="text-sm font-semibold text-danger underline underline-offset-2">
                  Révoquer
                </button>
              </form>
            </div>
          </div>
        ) : (
          <form action={genererTokenIcal} className="mt-4">
            <button type="submit" className="btn btn-accent">Générer un lien d&apos;abonnement</button>
          </form>
        )}

        {historique.filter((t) => t.revokedAt).length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-ink/40">Anciens liens révoqués</summary>
            <ul className="mt-2 space-y-1 text-xs text-ink/40">
              {historique
                .filter((t) => t.revokedAt)
                .map((t) => (
                  <li key={t.id}>révoqué le {formatDateTime(t.revokedAt)}</li>
                ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
