import type { Account, BrandProfile } from "@/db/schema";
import { PLATFORMS } from "@/lib/constants";
import { ListEditor } from "@/components/ListEditor";
import { SubmitButton } from "@/components/SubmitButton";

const SIZES = [
  { value: "solo", label: "Solo" },
  { value: "tpe", label: "TPE" },
  { value: "pme", label: "PME" },
  { value: "collectivite", label: "Collectivité" },
];

const ACCOUNT_COLORS = [
  "#DE2F2C", "#B13589", "#1877F2", "#0A66C2", "#3D7C47",
  "#D97706", "#6D28D9", "#0F766E", "#1C1917",
];

function parse<T>(json: string | undefined, fallback: T): T {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

export function ContexteTab({
  account,
  profile,
  action,
}: {
  account: Account;
  profile?: BrandProfile;
  action: (formData: FormData) => Promise<void>;
}) {
  const platforms: string[] = parse(account.platforms, []);
  return (
    <form action={action} className="mt-5 space-y-8">
      <section className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="field-label">Nom de la marque *</span>
          <input name="name" required defaultValue={account.name} className="field" />
        </label>
        <label>
          <span className="field-label">Secteur</span>
          <input name="sector" defaultValue={account.sector ?? ""} className="field" />
        </label>
        <label>
          <span className="field-label">Taille</span>
          <select name="size" defaultValue={profile?.size ?? "solo"} className="field">
            {SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Localisation</span>
          <input name="location" defaultValue={profile?.location ?? ""} className="field" placeholder="Nantes, 44…" />
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
            defaultValue={account.validationDelayDays}
            className="field"
          />
        </label>
        <fieldset className="md:col-span-2">
          <span className="field-label">Couleur de la marque</span>
          <div className="flex gap-2 pt-1">
            {ACCOUNT_COLORS.map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="color" value={c} defaultChecked={account.color === c} className="peer sr-only" />
                <span className="block h-7 w-7 border-2 border-transparent peer-checked:border-ink" style={{ backgroundColor: c }} />
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl">L&apos;entreprise</h3>
        <label>
          <span className="field-label">Description libre</span>
          <textarea name="description" rows={3} defaultValue={profile?.description ?? ""} className="field" />
        </label>
        <label>
          <span className="field-label">Offre (produits/services principaux)</span>
          <textarea name="offering" rows={2} defaultValue={profile?.offering ?? ""} className="field" />
        </label>
        <label>
          <span className="field-label">Positionnement (en une phrase)</span>
          <input name="positioning" defaultValue={profile?.positioning ?? ""} className="field" />
        </label>
        <label>
          <span className="field-label">Cible / personas</span>
          <textarea name="personas" rows={2} defaultValue={profile?.personas ?? ""} className="field" />
        </label>
      </section>

      <section>
        <h3 className="font-display text-xl">Personnes clés</h3>
        <p className="mt-1 text-xs text-ink/50">Mini-CRM : nom, rôle, contact, préférences.</p>
        <div className="mt-2">
          <ListEditor
            name="keyPeople"
            fields={[
              { key: "name", label: "Nom" },
              { key: "role", label: "Rôle" },
              { key: "contact", label: "E-mail / téléphone" },
              { key: "prefs", label: "Préférences de contact" },
            ]}
            defaultItems={parse(profile?.keyPeople, [])}
            addLabel="+ Ajouter une personne"
          />
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl">Concurrents à surveiller</h3>
        <div className="mt-2">
          <ListEditor
            name="competitors"
            fields={[{ key: "value", label: "Concurrent" }]}
            defaultItems={parse<string[]>(profile?.competitors, []).map((v) => ({ value: v }))}
            addLabel="+ Ajouter un concurrent"
          />
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl">Saisonnalité &amp; temps forts</h3>
        <div className="mt-2">
          <ListEditor
            name="seasonality"
            fields={[
              { key: "label", label: "Événement" },
              { key: "period", label: "Période" },
            ]}
            defaultItems={parse(profile?.seasonality, [])}
            addLabel="+ Ajouter un temps fort"
          />
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl">Liens</h3>
        <div className="mt-2">
          <ListEditor
            name="links"
            fields={[
              { key: "platform", label: "Plateforme (site, IG…)" },
              { key: "url", label: "URL" },
            ]}
            defaultItems={parse(profile?.links, [])}
            addLabel="+ Ajouter un lien"
          />
        </div>
      </section>

      <SubmitButton label="Enregistrer le contexte" />
    </form>
  );
}
