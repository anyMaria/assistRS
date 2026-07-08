import { OPERATORS, RULE_FIELDS } from "@/lib/color-rules";
import { SubmitButton } from "@/components/SubmitButton";

const SWATCHES = ["#E5484D", "#F5A524", "#17B26A", "#0A66C2", "#B13589", "#8A857B", "#0E1116"];

/** Formulaire de création d'une règle de couleur conditionnelle, pour une entité donnée. */
export function ColorRuleForm({
  entity,
  fields,
  action,
}: {
  entity: "idees" | "publications";
  fields: (typeof RULE_FIELDS)[string];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-3 md:grid-cols-5">
      <input type="hidden" name="entity" value={entity} />
      <label>
        <span className="field-label">Champ</span>
        <select name="field" required className="field text-sm" defaultValue={fields[0]?.value}>
          {fields.map((f) => (
            <option key={f.value} value={f.value} title={f.hint}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Opérateur</span>
        <select name="operator" required className="field text-sm">
          {OPERATORS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Valeur</span>
        <input name="value" required className="field text-sm" placeholder="ex. publiee, 2…" />
      </label>
      <fieldset>
        <span className="field-label">Couleur</span>
        <div className="flex flex-wrap gap-1 pt-1">
          {SWATCHES.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={c === SWATCHES[0]} className="peer sr-only" />
              <span className="block h-6 w-6 border-2 border-transparent peer-checked:border-ink" style={{ backgroundColor: c }} />
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        <span className="field-label">Libellé</span>
        <input name="label" className="field text-sm" placeholder="Deadline dépassée…" />
      </label>
      <div className="md:col-span-5">
        <SubmitButton label="Ajouter la règle" />
      </div>
    </form>
  );
}
