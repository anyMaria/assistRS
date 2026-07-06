import { PLATFORMS } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

/** Transforme une idée en publication planifiée liée (bouton clé du pipeline). */
export function PlanifierIdeeForm({
  defaultPlatform,
  action,
}: {
  defaultPlatform?: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label>
        <span className="field-label">Plateforme</span>
        <select name="platform" defaultValue={defaultPlatform || PLATFORMS[0].value} className="field !py-1 text-xs">
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Publication le</span>
        <input type="datetime-local" name="plannedAt" className="field !py-1 text-xs" />
      </label>
      <SubmitButton label="Planifier cette idée" loadingLabel="Planification…" className="!py-1.5 text-xs" />
    </form>
  );
}
