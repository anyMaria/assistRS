"use client";

import { useEffect, useState } from "react";
import { BUDGET_MONTHLY_CAP_CENTS, BUDGET_SOFT_LIMIT_CENTS } from "@/lib/apify";

/**
 * Barre de budget mensuel Apify — remplissage animé, couleur ok → warn → danger.
 * `compact` (G15) : jauge discrète alignée dans l'en-tête de S'inspirer, avec l'alerte
 * en tooltip plutôt qu'en pleine largeur.
 */
export function BudgetBar({ spendCents, compact = false }: { spendCents: number; compact?: boolean }) {
  const [width, setWidth] = useState(0);
  const ratio = Math.min(1, spendCents / BUDGET_MONTHLY_CAP_CENTS);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(ratio * 100));
    return () => cancelAnimationFrame(id);
  }, [ratio]);

  const color =
    spendCents >= BUDGET_SOFT_LIMIT_CENTS ? "var(--color-danger)" : spendCents >= 250 ? "var(--color-warn)" : "var(--color-ok)";
  const alertText =
    spendCents >= BUDGET_SOFT_LIMIT_CENTS
      ? "⚠ Budget presque atteint — une confirmation sera demandée avant chaque nouvelle recherche."
      : undefined;

  if (compact) {
    return (
      <div className="flex shrink-0 items-center gap-2 text-xs" title={alertText ?? "Budget Apify du mois"}>
        <span className="text-ink/50">
          {(spendCents / 100).toFixed(2)} $ / {(BUDGET_MONTHLY_CAP_CENTS / 100).toFixed(2)} $
        </span>
        <div className="h-2 w-16 border border-line bg-white">
          <div className="h-full transition-[width] duration-500" style={{ width: `${width}%`, backgroundColor: color }} />
        </div>
        {alertText && <span aria-hidden className="text-danger">⚠</span>}
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="field-label mb-0">Budget Apify du mois</span>
        <span className="font-semibold">
          {(spendCents / 100).toFixed(2)} $ / {(BUDGET_MONTHLY_CAP_CENTS / 100).toFixed(2)} $
        </span>
      </div>
      <div className="mt-2 h-3 w-full border border-line bg-white">
        <div
          className="h-full transition-[width] duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      {alertText && (
        <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-danger">
          <span aria-hidden>⚠</span> Budget presque atteint — une confirmation sera demandée avant chaque
          nouvelle recherche.
        </p>
      )}
    </div>
  );
}
