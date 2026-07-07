"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  genererPropositions,
  validerRituel,
  type GenererResult,
  type ValiderItem,
} from "@/app/actions/rituel";
import { FORMATS, platformLabel } from "@/lib/constants";

type Answers = {
  quoiDeNeuf: string;
  promos: string;
  evenements: string;
  contraintes: string;
  nombrePublications: number;
};

type Item = ValiderItem & { id: number; keep: boolean };

const initialGenState: GenererResult | null = null;

export function RitualWizard({
  ritualId,
  status,
  answers,
  proposal,
}: {
  ritualId: number;
  status: string;
  answers: Answers;
  proposal: ValiderItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(() => proposal.map((p, i) => ({ ...p, id: i, keep: true })));
  const [genState, genAction, genPending] = useActionState(
    async (_prev: GenererResult | null, formData: FormData) => {
      const res = await genererPropositions(ritualId, formData);
      if (res.ok) router.refresh();
      return res;
    },
    initialGenState,
  );
  const [validerPending, startValider] = useTransition();
  const [validerError, setValiderError] = useState<string | null>(null);

  function updateItem(id: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function handleValider() {
    setValiderError(null);
    const kept: ValiderItem[] = items
      .filter((it) => it.keep)
      .map(({ date, heure, plateforme, format, pilier, titre, accroche }) => ({
        date,
        heure,
        plateforme,
        format,
        pilier,
        titre,
        accroche,
      }));
    if (kept.length === 0) {
      setValiderError("Garde au moins une publication avant de valider.");
      return;
    }
    startValider(async () => {
      const res = await validerRituel(ritualId, kept);
      if (!res.ok) {
        setValiderError(res.error);
        return;
      }
      router.push("/planning");
    });
  }

  if (status === "valide") {
    return (
      <p className="card mt-6 p-6">
        <span className="font-semibold text-ok">✓ Rituel validé pour ce mois</span> — les publications
        retenues sont dans le{" "}
        <a href="/planning" className="font-semibold text-accent underline">
          planning
        </a>
        .
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <form action={genAction} className="card space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="field-label">Quoi de neuf ce mois-ci ?</span>
            <textarea name="quoiDeNeuf" rows={2} defaultValue={answers.quoiDeNeuf} className="field" />
          </label>
          <label>
            <span className="field-label">Promos / lancements</span>
            <textarea name="promos" rows={2} defaultValue={answers.promos} className="field" />
          </label>
          <label>
            <span className="field-label">Événements</span>
            <textarea name="evenements" rows={2} defaultValue={answers.evenements} className="field" />
          </label>
          <label>
            <span className="field-label">Contraintes</span>
            <textarea name="contraintes" rows={2} defaultValue={answers.contraintes} className="field" />
          </label>
        </div>
        <label className="block max-w-xs">
          <span className="field-label">Nombre de publications souhaité</span>
          <input
            type="number"
            name="nombrePublications"
            min={1}
            max={30}
            inputMode="numeric"
            defaultValue={answers.nombrePublications}
            className="field"
          />
        </label>

        {genState && !genState.ok && (
          <p className="flex items-center gap-2 border-2 border-danger p-3 text-sm font-semibold text-danger">
            <span aria-hidden>⚠</span> {genState.error}
          </p>
        )}

        <button type="submit" className="btn btn-accent" disabled={genPending}>
          {genPending ? "Préparation du calendrier…" : "Proposer le calendrier"}
        </button>
      </form>

      {items.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-2xl">Calendrier proposé</h2>
          <p className="text-sm text-ink/60">
            Garde, édite ou retire chaque ligne, puis valide — les publications retenues seront
            planifiées avec leurs deadlines calculées automatiquement.
          </p>
          {items.map((it) => (
            <div key={it.id} className={`card space-y-2 p-4 transition-opacity ${it.keep ? "" : "opacity-40"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={it.keep}
                    onChange={(e) => updateItem(it.id, { keep: e.target.checked })}
                  />
                  Garder
                </label>
                <span className="tag">
                  {it.date} · {it.heure}h
                </span>
                <span className="tag">{platformLabel(it.plateforme)}</span>
                <select
                  className="field w-auto"
                  value={it.format}
                  onChange={(e) => updateItem(it.id, { format: e.target.value })}
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <input
                  className="field w-auto"
                  value={it.pilier}
                  onChange={(e) => updateItem(it.id, { pilier: e.target.value })}
                  placeholder="Pilier"
                />
              </div>
              <input
                className="field"
                value={it.titre}
                onChange={(e) => updateItem(it.id, { titre: e.target.value })}
                placeholder="Titre"
              />
              <textarea
                className="field"
                rows={2}
                value={it.accroche}
                onChange={(e) => updateItem(it.id, { accroche: e.target.value })}
                placeholder="Accroche"
              />
            </div>
          ))}

          {validerError && (
            <p className="flex items-center gap-2 border-2 border-danger p-3 text-sm font-semibold text-danger">
              <span aria-hidden>⚠</span> {validerError}
            </p>
          )}

          <button type="button" onClick={handleValider} disabled={validerPending} className="btn btn-accent">
            {validerPending ? "Validation…" : "Valider le calendrier"}
          </button>
        </div>
      )}
    </div>
  );
}
