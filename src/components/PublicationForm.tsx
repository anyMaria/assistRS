import type { Account, Publication } from "@/db/schema";
import { PLATFORMS, FORMATS, PUBLICATION_STATUSES } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PublicationForm({
  accounts,
  publication,
  action,
  submitLabel,
}: {
  accounts: Account[];
  publication?: Publication;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <label>
        <span className="field-label">Compte *</span>
        <select name="accountId" required defaultValue={publication?.accountId} className="field">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Plateforme *</span>
        <select name="platform" required defaultValue={publication?.platform} className="field">
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Format *</span>
        <select name="format" required defaultValue={publication?.format} className="field">
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>
      <label className="md:col-span-2">
        <span className="field-label">Titre / sujet</span>
        <input name="title" defaultValue={publication?.title ?? ""} className="field" placeholder="Carrousel avant/après — rénovation logo" />
      </label>
      <label>
        <span className="field-label">Statut</span>
        <select name="status" defaultValue={publication?.status ?? "planifiee"} className="field">
          {PUBLICATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Publication prévue le</span>
        <input
          type="datetime-local"
          name="plannedAt"
          defaultValue={toLocalInput(publication?.plannedAt ?? null)}
          className="field"
        />
      </label>
      <label>
        <span className="field-label">Publiée le</span>
        <input
          type="datetime-local"
          name="publishedAt"
          defaultValue={toLocalInput(publication?.publishedAt ?? null)}
          className="field"
        />
      </label>
      <label>
        <span className="field-label">Lien</span>
        <input name="url" defaultValue={publication?.url ?? ""} className="field" placeholder="https://…" />
      </label>
      <label className="md:col-span-2">
        <span className="field-label">Visuel (URL de l&apos;image finale)</span>
        <input
          name="visualUrl"
          defaultValue={publication?.visualUrl ?? ""}
          className="field"
          placeholder="https://… (pour la vue Galerie)"
        />
      </label>
      <div className="md:col-span-3">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
