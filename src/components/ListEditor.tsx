"use client";

import { useState } from "react";

export type ListField = { key: string; label: string; placeholder?: string };

/**
 * Éditeur générique de listes (personnes clés, concurrents, piliers, ton, do's/don'ts, CTA…).
 * Ajoute/supprime des lignes ; sérialise le tout en JSON dans un <input type="hidden">.
 * Si `fields` ne contient qu'une entrée, chaque ligne est une simple chaîne (ex. hashtags).
 */
export function ListEditor({
  name,
  fields,
  defaultItems,
  addLabel = "+ Ajouter une ligne",
  emptyItem,
}: {
  name: string;
  fields: ListField[];
  defaultItems: Record<string, string>[];
  addLabel?: string;
  emptyItem?: Record<string, string>;
}) {
  const [items, setItems] = useState<Record<string, string>[]>(defaultItems);
  const simple = fields.length === 1;

  function update(index: number, key: string, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  }
  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }
  function add() {
    setItems((prev) => [...prev, emptyItem ?? Object.fromEntries(fields.map((f) => [f.key, ""]))]);
  }

  const serialized = simple
    ? JSON.stringify(items.map((it) => it[fields[0].key] ?? ""))
    : JSON.stringify(items);

  return (
    <div>
      <input type="hidden" name={name} value={serialized} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            {fields.map((f) => (
              <input
                key={f.key}
                value={item[f.key] ?? ""}
                onChange={(e) => update(i, f.key, e.target.value)}
                placeholder={f.placeholder ?? f.label}
                className="field flex-1 !py-1.5 text-sm"
              />
            ))}
            <button
              type="button"
              onClick={() => remove(i)}
              title="Supprimer cette ligne"
              className="text-sm font-semibold text-danger"
            >
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs italic text-ink/40">Rien pour l&apos;instant.</p>}
      </div>
      <button type="button" onClick={add} className="btn mt-2 px-3 py-1 text-xs">
        {addLabel}
      </button>
    </div>
  );
}
