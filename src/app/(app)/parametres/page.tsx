import { headers } from "next/headers";
import { isNull, desc } from "drizzle-orm";
import { db, icalTokens } from "@/db";
import { genererTokenIcal, revoquerTokenIcal } from "@/app/actions/ical";
import { formatDateTime } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const [activeToken] = await db.select().from(icalTokens).where(isNull(icalTokens.revokedAt));
  const historique = await db.select().from(icalTokens).orderBy(desc(icalTokens.createdAt)).limit(5);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  return (
    <div>
      <h1 className="font-display text-4xl italic">Paramètres</h1>
      <p className="mt-1 text-ink/60">Réglages de l&apos;application.</p>

      <section className="card mt-6 p-5">
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
                <button type="submit" className="btn text-sm">↻ Régénérer (révoque l&apos;ancien lien)</button>
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
