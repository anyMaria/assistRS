"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
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

/** En-tête compact (G15) : thème + chips de sources + bouton sur une ligne, marque/période/tri repliés. */
export function SearchForm({ accounts, defaultTheme }: { accounts: Account[]; defaultTheme: string }) {
  const router = useRouter();
  const [optionsOpen, setOptionsOpen] = useState(false);
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
    <form action={formAction} className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="min-w-48 flex-1">
          <span className="sr-only">Thème</span>
          <input
            name="theme"
            required
            defaultValue={defaultTheme}
            placeholder="Thème : branding artisan, coulisses atelier…"
            className="field"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {APIFY_SOURCES.map((source) => {
            const meta = ACTORS[source];
            return (
              <label
                key={source}
                className="tag has-[:checked]:bg-ink has-[:checked]:text-white cursor-pointer whitespace-nowrap"
                title={meta.costLabel}
              >
                <input type="checkbox" name="sources" value={source} defaultChecked={meta.defaultChecked} className="sr-only" />
                {meta.label}
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOptionsOpen((v) => !v)}
          className={`btn shrink-0 text-sm ${optionsOpen ? "bg-ink text-white" : ""}`}
        >
          <SlidersHorizontal size={14} aria-hidden /> Options
        </button>

        <button type="submit" className="btn shrink-0" disabled={pending}>
          {pending ? "Recherche en cours…" : "Rechercher"}
        </button>
      </div>

      {optionsOpen && (
        <div className="grid gap-4 border-t border-line pt-3 md:grid-cols-3">
          <label>
            <span className="field-label">Marque (optionnel)</span>
            <select name="accountId" defaultValue="" className="field">
              <option value="">— aucune —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
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
      )}

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
    </form>
  );
}
