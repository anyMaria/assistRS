"use client";

import { useState } from "react";
import { Plus, SlidersHorizontal, Palette } from "lucide-react";
import type { ViewConfig, ColorRule } from "@/db/schema";
import { ViewTabs } from "./ViewTabs";
import { ViewSettingsForm } from "@/components/ViewSettingsForm";
import { ColorRuleForm } from "@/components/ColorRuleForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { createView, deleteView, updateViewSettings, createColorRule, deleteColorRule } from "@/app/actions/settings";
import { RULE_FIELDS, operatorLabel } from "@/lib/color-rules";

const TYPE_LABEL: Record<string, string> = {
  table: "Table",
  kanban: "Kanban",
  calendrier: "Calendrier",
  galerie: "Galerie",
};

/** Barre d'outils « vues à la volée » (G10) : créer/éditer/supprimer une vue, régler
    filtres/tri/couleurs, directement sur Idées et Planifier — sans passer par Paramètres. */
export function ViewToolbar({
  entity,
  basePath,
  extraParams = "",
  views,
  activeView,
  rules,
}: {
  entity: "idees" | "publications";
  basePath: string;
  extraParams?: string;
  views: ViewConfig[];
  activeView: ViewConfig;
  rules: ColorRule[];
}) {
  const [panel, setPanel] = useState<"none" | "nouvelle" | "reglages" | "couleurs">("none");
  const entityRules = rules.filter((r) => r.entity === entity);
  const fields = RULE_FIELDS[entity] ?? [];
  const toggle = (p: typeof panel) => setPanel((cur) => (cur === p ? "none" : p));

  return (
    <div className="mt-6">
      <ViewTabs
        views={views}
        activeId={activeView.id}
        basePath={basePath}
        extraParams={extraParams}
        trailing={
          <div className="ml-auto flex items-center gap-1 pb-1">
            <button type="button" onClick={() => toggle("nouvelle")} className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-ink/50 hover:text-accent">
              <Plus size={14} aria-hidden /> Nouvelle vue
            </button>
            <button type="button" onClick={() => toggle("reglages")} className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-ink/50 hover:text-accent">
              <SlidersHorizontal size={14} aria-hidden /> Filtres &amp; tri
            </button>
            <button type="button" onClick={() => toggle("couleurs")} className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-ink/50 hover:text-accent">
              <Palette size={14} aria-hidden /> Couleurs
            </button>
            {views.length > 1 && (
              <ConfirmDeleteButton
                action={deleteView.bind(null, activeView.id)}
                confirmMessage="Supprimer cette vue ?"
                label="Supprimer cette vue"
              />
            )}
          </div>
        }
      />

      {panel === "nouvelle" && (
        <div className="card mt-3 p-4">
          <form
            action={async (fd) => {
              await createView(fd);
              setPanel("none");
            }}
            className="grid gap-3 md:grid-cols-4"
          >
            <input type="hidden" name="entity" value={entity} />
            <label>
              <span className="field-label">Type</span>
              <select name="type" required className="field text-sm">
                <option value="table">Table</option>
                <option value="kanban">Kanban</option>
                <option value="calendrier">Calendrier</option>
                {entity === "publications" && <option value="galerie">Galerie</option>}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Nom</span>
              <input name="name" required className="field text-sm" placeholder="Ma vue" />
            </label>
            <div className="flex items-end">
              <button type="submit" className="btn btn-accent w-full text-sm">Créer</button>
            </div>
          </form>
        </div>
      )}

      {panel === "reglages" && (
        <div className="card mt-3">
          <ViewSettingsForm
            view={activeView}
            action={async (fd) => {
              await updateViewSettings(activeView.id, fd);
              setPanel("none");
            }}
          />
        </div>
      )}

      {panel === "couleurs" && (
        <div className="card mt-3 space-y-3 p-4">
          <p className="field-label">Règles de couleur — {TYPE_LABEL[activeView.type] ?? activeView.type}</p>
          {entityRules.length === 0 && <p className="text-sm italic text-ink/50">Aucune règle pour l&apos;instant.</p>}
          {entityRules.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 border-b border-line pb-2 text-sm">
              <span className="brand-chip" style={{ backgroundColor: r.color }} />
              <span>
                {r.field} {operatorLabel(r.operator)} <strong>{r.value}</strong>
              </span>
              {r.label && <span className="text-xs text-ink/50">« {r.label} »</span>}
              <div className="ml-auto">
                <ConfirmDeleteButton action={deleteColorRule.bind(null, r.id)} confirmMessage="Supprimer cette règle de couleur ?" />
              </div>
            </div>
          ))}
          <ColorRuleForm entity={entity} fields={fields} action={createColorRule} />
        </div>
      )}
    </div>
  );
}
