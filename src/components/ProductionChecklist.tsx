"use client";

import { useState, useTransition } from "react";
import { toggleStep } from "@/app/actions/production-steps";
import { PRODUCTION_STEPS, formatDate } from "@/lib/constants";
import type { ProductionStep } from "@/db/schema";

/** Checklist de production : cocher anime la case et fait apparaître la date. */
export function ProductionChecklist({
  publicationId,
  steps,
}: {
  publicationId: number;
  steps: ProductionStep[];
}) {
  const [pending, startTransition] = useTransition();
  const [justToggled, setJustToggled] = useState<string | null>(null);
  const byKey = new Map(steps.map((s) => [s.key, s]));

  function toggle(key: string) {
    setJustToggled(key);
    startTransition(async () => {
      await toggleStep(publicationId, key);
    });
    setTimeout(() => setJustToggled((k) => (k === key ? null : k)), 200);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {PRODUCTION_STEPS.map((step) => {
        const s = byKey.get(step.key);
        const done = s?.done ?? false;
        return (
          <button
            key={step.key}
            type="button"
            disabled={pending}
            onClick={() => toggle(step.key)}
            className="flex cursor-pointer items-center gap-1.5 text-left text-xs"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center border border-line transition-transform duration-150 ${
                done ? "bg-ink text-white" : "bg-white"
              } ${justToggled === step.key ? "scale-125" : "scale-100"}`}
              aria-hidden
            >
              {done ? "✓" : ""}
            </span>
            <span className="flex flex-col items-start">
              <span className={done ? "font-semibold" : "text-ink/60"}>{step.label}</span>
              {done && s?.doneAt && <span className="text-[10px] text-ink/40">{formatDate(s.doneAt)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
