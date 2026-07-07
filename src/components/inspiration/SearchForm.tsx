"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Account } from "@/db/schema";
import { lancerRecherche, type LancerRechercheResult } from "@/app/actions/inspiration";
import { ACTORS, APIFY_SOURCES } from "@/lib/apify";

const PERIODES = [
  { value: "toutes", label: "Toutes périodes" },
  { value: "7j", label: "7 derniers jours" },
  { value: "30j", label: "30 derniers jours" },
  { value: "12mois", label: "12 derniers mois" },
] as const;

const TRIS = [
  { value: "recent", label: "Plus récent" },
  { value: "signal", label: "Meilleur signal" },
] as const;

const initialState: LancerRechercheResult | null = null;

export function SearchForm({ accounts, defaultTheme }: { accounts: Account[]; defaultTheme: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: LancerRechercheResult | null, formData: FormData) => lancerRecherche(formData),
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      router.push(`/conception?onglet=inspirer&recherche=${state.searchIds.join(",")}`);
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="card space-y-4 p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="field-label">Thème *</span>
          <input
            name="theme"
            required
            defaultValue={defaultTheme}
            placeholder="branding artisan, coulisses atelier…"
            className="field"
          />
        </label>
        <label>
          <span className="field-label">Marque (optionnel)</span>
          <select name="accountId" defaultValue="" className="field">
            <option value="">— aucune —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="field-label">Sources à interroger</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {APIFY_SOURCES.map((source) => {
            const meta = ACTORS[source];
            return (
              <label
                key={source}
                className="flex cursor-pointer items-start gap-2 border-2 border-ink/20 p-3 hover:border-ink"
              >
                <input
                  type="checkbox"
                  name="sources"
                  value={source}
                  defaultChecked={meta.defaultChecked}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold">{meta.label}</span>
                  <span className="block text-xs text-ink/50">{meta.costLabel}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="field-label">Période</span>
          <select name="periode" defaultValue="toutes" className="field">
            {PERIODES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Tri</span>
          <select name="tri" defaultValue="recent" className="field">
            {TRIS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
      </div>

      {state && !state.ok && (
        <div className="border-2 border-danger bg-white p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <span aria-hidden>⚠</span> {state.error}
          </p>
          {state.requiresConfirmation && (
            <button type="submit" name="confirmer" value="1" className="btn btn-accent mt-3">
              Lancer quand même
            </button>
          )}
        </div>
      )}

      <button type="submit" className="btn btn-accent" disabled={pending}>
        {pending ? "Recherche en cours…" : "Lancer la recherche"}
      </button>
    </form>
  );
}
