import type { Account } from "@/db/schema";
import { PLATFORMS } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

const ACCOUNT_COLORS = [
  "#DE2F2C", "#B13589", "#1877F2", "#0A66C2", "#3D7C47",
  "#D97706", "#6D28D9", "#0F766E", "#1C1917",
];

/** Formulaire compte (création ou édition) — rendu côté serveur, action passée en prop. */
export function AccountForm({
  account,
  action,
  submitLabel,
}: {
  account?: Account;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const platforms: string[] = account ? JSON.parse(account.platforms) : [];
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="field-label">Nom du compte *</span>
        <input name="name" required defaultValue={account?.name} className="field" placeholder="Trinkets Design" />
      </label>
      <label>
        <span className="field-label">Secteur</span>
        <input name="sector" defaultValue={account?.sector ?? ""} className="field" placeholder="Graphisme, artisanat, collectivité…" />
      </label>
      <label>
        <span className="field-label">Ton éditorial</span>
        <input name="tone" defaultValue={account?.tone ?? ""} className="field" placeholder="Chaleureux, expert, décalé…" />
      </label>
      <label>
        <span className="field-label">Cible</span>
        <input name="audience" defaultValue={account?.audience ?? ""} className="field" placeholder="Artisans locaux, 25-45 ans…" />
      </label>
      <fieldset>
        <span className="field-label">Plateformes actives</span>
        <div className="flex gap-3 pt-1">
          {PLATFORMS.map((p) => (
            <label key={p.value} className="flex items-center gap-1.5 text-sm font-medium">
              <input
                type="checkbox"
                name="platforms"
                value={p.value}
                defaultChecked={platforms.includes(p.value)}
                className="h-4 w-4 accent-[#1C1917]"
              />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        <span className="field-label">Délai de validation client (jours)</span>
        <input
          type="number"
          name="validationDelayDays"
          min={0}
          max={60}
          defaultValue={account?.validationDelayDays ?? 3}
          className="field"
        />
        <span className="mt-1 block text-xs text-ink/50">
          Temps moyen entre l&apos;envoi du visuel et le retour du client — sert à calculer la
          date limite de création.
        </span>
      </label>
      <fieldset className="md:col-span-2">
        <span className="field-label">Couleur du compte</span>
        <div className="flex gap-2 pt-1">
          {ACCOUNT_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                defaultChecked={(account?.color ?? "#DE2F2C") === c}
                className="peer sr-only"
              />
              <span
                className="block h-7 w-7 border-2 border-transparent peer-checked:border-ink"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="md:col-span-2">
        <span className="field-label">Notes</span>
        <textarea name="notes" rows={2} defaultValue={account?.notes ?? ""} className="field" placeholder="Contraintes, hashtags récurrents, charte…" />
      </label>
      <div className="md:col-span-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
