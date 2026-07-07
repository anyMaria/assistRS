import type { ViewConfig } from "@/db/schema";
import { RULE_FIELDS, OPERATORS } from "@/lib/color-rules";
import { parseViewSettings } from "@/lib/view-config";
import { ListEditor } from "@/components/ListEditor";
import { SubmitButton } from "@/components/SubmitButton";

/** Réglages d'une vue : propriétés affichées (calendrier), tri, filtres, regroupement (kanban). */
export function ViewSettingsForm({
  view,
  action,
}: {
  view: ViewConfig;
  action: (formData: FormData) => Promise<void>;
}) {
  const settings = parseViewSettings(view.config);
  const fields = RULE_FIELDS[view.entity] ?? [];

  return (
    <form action={action} className="grid gap-4 border-t-2 border-ink p-4 md:grid-cols-2">
      <input type="hidden" name="groupBy" value={settings.groupBy ?? "status"} />

      {view.type === "calendrier" && (
        <fieldset className="md:col-span-2">
          <span className="field-label">Propriétés affichées sur les carreaux</span>
          <div className="flex flex-wrap gap-3 pt-1">
            {fields.map((f) => (
              <label key={f.value} className="flex items-center gap-1.5 text-sm font-medium">
                <input
                  type="checkbox"
                  name="displayProps"
                  value={f.value}
                  defaultChecked={settings.displayProps?.includes(f.value) ?? false}
                  className="h-4 w-4 accent-[#1C1917]"
                />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label>
        <span className="field-label">Trier par</span>
        <select name="sortBy" defaultValue={settings.sortBy ?? ""} className="field text-sm">
          <option value="">Aucun tri particulier</option>
          {fields.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Ordre</span>
        <select name="sortDir" defaultValue={settings.sortDir ?? "asc"} className="field text-sm">
          <option value="asc">Croissant</option>
          <option value="desc">Décroissant</option>
        </select>
      </label>

      <fieldset className="md:col-span-2">
        <span className="field-label">Filtres (combinés en ET)</span>
        <div className="mt-1 space-y-2">
          <ListEditor
            name="filters"
            fields={[
              { key: "field", label: `Champ (${fields.map((f) => f.value).join(", ")})` },
              { key: "operator", label: `Opérateur (${OPERATORS.map((o) => o.value).join(", ")})` },
              { key: "value", label: "Valeur" },
            ]}
            defaultItems={settings.filters ?? []}
            addLabel="+ Ajouter un filtre"
          />
        </div>
      </fieldset>

      <div className="md:col-span-2">
        <SubmitButton label="Enregistrer les réglages de la vue" />
      </div>
    </form>
  );
}
