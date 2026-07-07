"use client";

import { useEffect, useState } from "react";
import { BUDGET_MONTHLY_CAP_CENTS, BUDGET_SOFT_LIMIT_CENTS } from "@/lib/apify";

/** Barre de budget mensuel Apify — remplissage animé, couleur ok → warn → danger. */
export function BudgetBar({ spendCents }: { spendCents: number }) {
  const [width, setWidth] = useState(0);
  const ratio = Math.min(1, spendCents / BUDGET_MONTHLY_CAP_CENTS);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(ratio * 100));
    return () => cancelAnimationFrame(id);
  }, [ratio]);

  const color =
    spendCents >= BUDGET_SOFT_LIMIT_CENTS ? "var(--color-danger)" : spendCents >= 250 ? "var(--color-warn)" : "var(--color-ok)";

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="field-label mb-0">Budget Apify du mois</span>
        <span className="font-semibold">
          {(spendCents / 100).toFixed(2)} $ / {(BUDGET_MONTHLY_CAP_CENTS / 100).toFixed(2)} $
        </span>
      </div>
      <div className="mt-2 h-3 w-full border-2 border-ink bg-white">
        <div
          className="h-full transition-[width] duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      {spendCents >= BUDGET_SOFT_LIMIT_CENTS && (
        <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-danger">
          <span aria-hidden>⚠</span> Budget presque atteint — une confirmation sera demandée avant chaque
          nouvelle recherche.
        </p>
      )}
    </div>
  );
}
