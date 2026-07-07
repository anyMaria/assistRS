import { addSnapshot } from "@/app/actions/publications";
import { STAT_FIELDS } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

/** Saisie rapide d'un relevé de stats — pensé mobile : gros champs numériques. */
export function SnapshotForm({ publicationId }: { publicationId: number }) {
  return (
    <form action={addSnapshot} className="grid grid-cols-3 gap-3 md:grid-cols-5">
      <input type="hidden" name="publicationId" value={publicationId} />
      {STAT_FIELDS.map((f) => (
        <label key={f.value}>
          <span className="field-label">{f.label}</span>
          <input
            type="number"
            inputMode="numeric"
            name={f.value}
            min={f.value === "followersGained" ? undefined : 0}
            placeholder="0"
            className="field"
          />
        </label>
      ))}
      <div className="col-span-3 md:col-span-5">
        <SubmitButton label="Enregistrer le relevé" />
      </div>
    </form>
  );
}
