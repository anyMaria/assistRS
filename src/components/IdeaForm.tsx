"use client";

import { useState } from "react";
import type { Account } from "@/db/schema";
import { PLATFORMS, FORMATS, FEASIBILITY_LEVELS, suggestedFeasibility } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

/** Formulaire de création rapide d'une idée — les piliers proposés suivent la marque choisie. */
export function IdeaForm({
  accounts,
  pillarsByAccount,
  action,
  defaultTitle = "",
  defaultContent = "",
}: {
  accounts: Account[];
  pillarsByAccount: Record<number, string[]>;
  action: (formData: FormData) => Promise<void>;
  /** Pré-remplissage venu d'une note pense-bête convertie en idée (G12). */
  defaultTitle?: string;
  defaultContent?: string;
}) {
  const [accountId, setAccountId] = useState<number>(accounts[0]?.id ?? 0);
  const [format, setFormat] = useState("post");
  const pillars = pillarsByAccount[accountId] ?? [];

  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <label>
        <span className="field-label">Marque *</span>
        <select
          name="accountId"
          required
          value={accountId}
          onChange={(e) => setAccountId(Number(e.target.value))}
          className="field"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </label>
      <label className="md:col-span-2">
        <span className="field-label">Titre *</span>
        <input name="title" required defaultValue={defaultTitle} className="field" placeholder="Carrousel : 5 erreurs à éviter" />
      </label>

      <label>
        <span className="field-label">Pilier</span>
        {pillars.length > 0 ? (
          <select name="pillar" defaultValue="" className="field">
            <option value="">—</option>
            {pillars.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        ) : (
          <>
            <input name="pillar" className="field" placeholder="Aucun pilier défini pour cette marque" disabled />
            <span className="mt-1 block text-xs text-ink/50">
              Ajoute des piliers dans l&apos;onglet Ligne éditoriale de la marque pour les retrouver ici.
            </span>
          </>
        )}
      </label>
      <label>
        <span className="field-label">Thème (libre, optionnel)</span>
        <input name="theme" className="field" placeholder="branding, coulisses…" />
      </label>
      <label>
        <span className="field-label">Format</span>
        <select name="format" value={format} onChange={(e) => setFormat(e.target.value)} className="field">
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">Plateforme</span>
        <select name="platform" defaultValue="" className="field">
          <option value="">—</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Faisabilité</span>
        <select name="feasibility" key={format} defaultValue={suggestedFeasibility(format)} className="field">
          {FEASIBILITY_LEVELS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-ink/50">
          Temps de production estimé (montage, récolte d&apos;infos…) — modifiable.
        </span>
      </label>
      <label className="md:col-span-3">
        <span className="field-label">Structure / notes</span>
        <textarea name="content" rows={2} defaultValue={defaultContent} className="field" placeholder="Accroche, plan, CTA…" />
      </label>
      <div className="md:col-span-3">
        <SubmitButton label="Ajouter l'idée" />
      </div>
    </form>
  );
}
