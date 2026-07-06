import type { Account } from "@/db/schema";
import { PLATFORMS, FORMATS } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

/** Formulaire de création rapide d'une idée. */
export function IdeaForm({
  accounts,
  action,
}: {
  accounts: Account[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <label>
        <span className="field-label">Compte *</span>
        <select name="accountId" required className="field">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </label>
      <label className="md:col-span-2">
        <span className="field-label">Titre *</span>
        <input name="title" required className="field" placeholder="Carrousel : 5 erreurs à éviter" />
      </label>
      <label>
        <span className="field-label">Thème</span>
        <input name="theme" className="field" placeholder="branding, coulisses…" />
      </label>
      <label>
        <span className="field-label">Format</span>
        <select name="format" defaultValue="post" className="field">
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Plateforme</span>
        <select name="platform" defaultValue="" className="field">
          <option value="">—</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>
      <label className="md:col-span-3">
        <span className="field-label">Structure / notes</span>
        <textarea name="content" rows={2} className="field" placeholder="Accroche, plan, CTA…" />
      </label>
      <div className="md:col-span-3">
        <SubmitButton label="Ajouter l'idée" />
      </div>
    </form>
  );
}
