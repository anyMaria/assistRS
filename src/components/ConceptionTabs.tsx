"use client";

import { useState, type ReactNode } from "react";
import { Lightbulb, Sparkles as SparklesIcon } from "lucide-react";

const TABS = [
  { key: "idees" as const, label: "Idées", icon: Lightbulb },
  { key: "inspirer" as const, label: "S'inspirer", icon: SparklesIcon },
];

/**
 * Bascule Idées ↔ S'inspirer sans rechargement (G15) : les deux panneaux sont déjà
 * rendus côté serveur (passés en enfants), ce composant ne fait que gérer la visibilité
 * et synchroniser l'URL (`?onglet=`) via `history.replaceState` — jamais `router.push`,
 * pour ne pas déclencher de navigation ni perdre le scroll.
 */
export function ConceptionTabs({
  initialTab,
  ideesPanel,
  inspirerPanel,
}: {
  initialTab: "idees" | "inspirer";
  ideesPanel: ReactNode;
  inspirerPanel: ReactNode;
}) {
  const [tab, setTab] = useState<"idees" | "inspirer">(initialTab);

  function switchTo(t: "idees" | "inspirer") {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("onglet", t);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div>
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTo(t.key)}
            className={`btn shrink-0 ${tab === t.key ? "bg-ink text-white" : ""}`}
          >
            <t.icon size={15} aria-hidden /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8" hidden={tab !== "idees"}>
        {ideesPanel}
      </div>
      <div className="mt-8" hidden={tab !== "inspirer"}>
        {inspirerPanel}
      </div>
    </div>
  );
}
