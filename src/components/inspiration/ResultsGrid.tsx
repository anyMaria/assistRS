"use client";

import { useState } from "react";
import type { InspirationItem, Moodboard } from "@/db/schema";
import { ItemCard } from "@/components/inspiration/ItemCard";

/** Grille de résultats — masque les items hors sujet (relevant = false) par défaut. */
export function ResultsGrid({
  items,
  moodboards,
  accountId,
  theme,
}: {
  items: InspirationItem[];
  moodboards: Moodboard[];
  accountId: number | null;
  theme?: string;
}) {
  const [showHidden, setShowHidden] = useState(false);
  const relevant = items.filter((i) => i.relevant);
  const hidden = items.filter((i) => !i.relevant);
  const visible = showHidden ? items : relevant;

  return (
    <div>
      <div className="columns-1 gap-4 p-4 sm:columns-2 lg:columns-3">
        {visible.map((item) => (
          <ItemCard key={item.id} item={item} moodboards={moodboards} accountId={accountId} theme={theme} />
        ))}
      </div>
      {hidden.length > 0 && !showHidden && (
        <button
          type="button"
          onClick={() => setShowHidden(true)}
          className="btn mx-4 mb-4 text-xs"
        >
          Voir aussi {hidden.length} résultat{hidden.length > 1 ? "s" : ""} hors sujet
        </button>
      )}
    </div>
  );
}
