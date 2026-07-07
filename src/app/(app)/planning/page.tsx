import Link from "next/link";
import { asc, eq, inArray } from "drizzle-orm";
import { db, accounts, publications, productionSteps, recurrences } from "@/db";
import { generateOccurrences } from "@/lib/recurrences";
import {
  createPublication,
  duplicatePublication,
  deletePublication,
  setPublicationStatus,
} from "@/app/actions/publications";
import { createRecurrence, toggleRecurrenceActive, deleteRecurrence } from "@/app/actions/recurrences";
import { PublicationForm } from "@/components/PublicationForm";
import { ProductionChecklist } from "@/components/ProductionChecklist";
import {
  PLATFORMS,
  FORMATS,
  DAYS,
  RECURRENCE_FREQS,
  platformLabel,
  platformColor,
  formatLabel,
  formatDateTime,
} from "@/lib/constants";
import { computeVisualDeadline, deadlineStatus, deadlineMessage } from "@/lib/deadline";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  await generateOccurrences();

  const [allAccounts, allRecurrences] = await Promise.all([
    db.select().from(accounts),
    db.select().from(recurrences),
  ]);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const pubs = await db
    .select()
    .from(publications)
    .where(eq(publications.status, "planifiee"))
    .orderBy(asc(publications.plannedAt));
  const steps = pubs.length
    ? await db
        .select()
        .from(productionSteps)
        .where(inArray(productionSteps.publicationId, pubs.map((p) => p.id)))
    : [];
  const stepsByPub = new Map<number, typeof steps>();
  for (const s of steps) {
    const list = stepsByPub.get(s.publicationId) ?? [];
    list.push(s);
    stepsByPub.set(s.publicationId, list);
  }

  return (
    <div>
      <h1 className="font-display text-4xl italic">Planning</h1>
      <p className="mt-1 text-ink/60">
        Publications planifiées, checklist de production et récurrences.
      </p>

      {allAccounts.length === 0 ? (
        <p className="card mt-6 p-5">
          Commence par <Link href="/comptes" className="font-semibold text-accent underline">créer un compte</Link>.
        </p>
      ) : (
        <>
          <details className="card mt-6">
            <summary className="cursor-pointer p-4 font-display text-2xl">
              + Nouvelle publication
            </summary>
            <div className="border-t-2 border-ink p-5">
              <PublicationForm
                accounts={allAccounts}
                action={createPublication}
                submitLabel="Ajouter la publication"
              />
            </div>
          </details>

          <details className="card mt-4">
            <summary className="cursor-pointer p-4 font-display text-2xl">
              ⟳ Récurrences ({allRecurrences.length})
            </summary>
            <div className="space-y-5 border-t-2 border-ink p-5">
              <form action={createRecurrence} className="grid gap-4 md:grid-cols-3">
                <label>
                  <span className="field-label">Compte *</span>
                  <select name="accountId" required className="field">
                    {allAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Plateforme *</span>
                  <select name="platform" required className="field">
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Format *</span>
                  <select name="format" required className="field">
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </label>
                <label className="md:col-span-2">
                  <span className="field-label">Titre type *</span>
                  <input name="titlePattern" required className="field" placeholder="Post FAQ" />
                </label>
                <label>
                  <span className="field-label">Fréquence</span>
                  <select name="freq" defaultValue="hebdo" className="field">
                    {RECURRENCE_FREQS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Jour *</span>
                  <select name="dayOfWeek" required defaultValue="0" className="field">
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Heure *</span>
                  <input
                    type="number"
                    name="hour"
                    required
                    min={0}
                    max={23}
                    defaultValue={11}
                    inputMode="numeric"
                    className="field"
                  />
                </label>
                <div className="md:col-span-3">
                  <button type="submit" className="btn btn-accent">Créer la récurrence</button>
                </div>
              </form>

              {allRecurrences.length > 0 && (
                <ul className="space-y-2">
                  {allRecurrences.map((rec) => {
                    const account = accountById.get(rec.accountId);
                    const toggle = toggleRecurrenceActive.bind(null, rec.id);
                    const remove = deleteRecurrence.bind(null, rec.id);
                    return (
                      <li key={rec.id} className="flex flex-wrap items-center gap-2 border-2 border-ink/20 p-3 text-sm">
                        <span className="tag">{platformLabel(rec.platform)}</span>
                        <span className="font-semibold">{rec.titlePattern}</span>
                        <span className="text-ink/50">
                          {account?.name} · {DAYS[rec.dayOfWeek]} {rec.hour}h ·{" "}
                          {rec.freq === "hebdo" ? "chaque semaine" : "chaque mois"}
                        </span>
                        <form action={toggle}>
                          <button type="submit" className="btn text-xs">
                            {rec.active ? "Active" : "En pause"}
                          </button>
                        </form>
                        <form action={remove}>
                          <button type="submit" className="text-xs font-semibold text-danger underline underline-offset-2">
                            Supprimer
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </details>

          <section className="mt-8 space-y-4">
            {pubs.length === 0 && (
              <p className="text-ink/50 italic">Aucune publication planifiée pour l&apos;instant.</p>
            )}
            {pubs.map((pub) => {
              const account = accountById.get(pub.accountId);
              const pubSteps = stepsByPub.get(pub.id) ?? [];
              const deadline = pub.plannedAt
                ? computeVisualDeadline(pub.plannedAt, account?.validationDelayDays ?? 3)
                : null;
              const status = deadline ? deadlineStatus(deadline) : "ok";
              const duplicate = duplicatePublication.bind(null, pub.id);
              const remove = deletePublication.bind(null, pub.id);
              const markPublished = setPublicationStatus.bind(null, pub.id, "publiee");
              return (
                <div
                  key={pub.id}
                  className="card p-4"
                  style={{
                    borderLeftWidth: 8,
                    borderLeftColor:
                      status === "depassee" ? "#7A1512" : status === "proche" ? "#D97706" : (account?.color ?? "#1C1917"),
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="tag text-white"
                      style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}
                    >
                      {platformLabel(pub.platform)}
                    </span>
                    <span className="tag">{formatLabel(pub.format)}</span>
                    <span className="font-semibold">{pub.title || "Sans titre"}</span>
                    <span className="text-sm text-ink/50">
                      {account?.name} · publication le {formatDateTime(pub.plannedAt)}
                    </span>
                    {deadline && (
                      <span
                        className={`text-sm font-semibold ${
                          status === "depassee" ? "text-danger" : status === "proche" ? "text-warn" : "text-ink/70"
                        }`}
                      >
                        {deadlineMessage(deadline)}
                      </span>
                    )}
                    <div className="ml-auto flex flex-wrap gap-2">
                      <form action={markPublished}>
                        <button type="submit" className="btn text-xs">✓ Publiée</button>
                      </form>
                      <form action={duplicate}>
                        <button type="submit" className="btn text-xs">⧉ Dupliquer</button>
                      </form>
                      <form action={remove}>
                        <button type="submit" className="text-xs font-semibold text-danger underline underline-offset-2">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="mt-3 border-t-2 border-ink/10 pt-3">
                    <ProductionChecklist publicationId={pub.id} steps={pubSteps} />
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
