"use client";

import { useState } from "react";
import type { ViewConfig, ColorRule } from "@/db/schema";
import { ViewTabs } from "./ViewTabs";
import { ViewSettingsForm } from "@/components/ViewSettingsForm";
import { ColorRuleForm } from "@/components/ColorRuleForm";
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
            <button type="button" onClick={() => toggle("nouvelle")} className="px-2 py-1.5 text-sm font-semibold text-ink/50 hover:text-accent">
              + Nouvelle vue
            </button>
            <button type="button" onClick={() => toggle("reglages")} className="px-2 py-1.5 text-sm font-semibold text-ink/50 hover:text-accent">
              Filtres &amp; tri
            </button>
            <button type="button" onClick={() => toggle("couleurs")} className="px-2 py-1.5 text-sm font-semibold text-ink/50 hover:text-accent">
              Couleurs
            </button>
            {views.length > 1 && (
              <form action={deleteView.bind(null, activeView.id)}>
                <button type="submit" className="px-2 py-1.5 text-sm font-semibold text-danger/70 hover:text-danger">
                  Supprimer cette vue
                </button>
              </form>
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
            <div key={r.id} className="flex flex-wrap items-center gap-2 border-b border-ink/10 pb-2 text-sm">
              <span className="h-4 w-4 border border-ink" style={{ backgroundColor: r.color }} />
              <span>
                {r.field} {operatorLabel(r.operator)} <strong>{r.value}</strong>
              </span>
              {r.label && <span className="text-xs text-ink/50">« {r.label} »</span>}
              <form action={deleteColorRule.bind(null, r.id)} className="ml-auto">
                <button type="submit" className="text-xs font-semibold text-danger underline underline-offset-2">
                  Supprimer
                </button>
              </form>
            </div>
          ))}
          <ColorRuleForm entity={entity} fields={fields} action={createColorRule} />
        </div>
      )}
    </div>
  );
}
