import type { BrandAsset, BrandIdentity } from "@/db/schema";
import { ListEditor } from "@/components/ListEditor";
import { SubmitButton } from "@/components/SubmitButton";

const ASSET_TYPES = [
  { value: "logo", label: "Logo" },
  { value: "gabarit", label: "Gabarit" },
  { value: "photo", label: "Photo" },
  { value: "moodboard", label: "Moodboard" },
];

function parse<T>(json: string | undefined, fallback: T): T {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

export function IdentiteTab({
  identity,
  assets,
  accountId,
  action,
  deleteAssetAction,
  assetError,
  blobConfigured,
}: {
  identity?: BrandIdentity;
  assets: BrandAsset[];
  accountId: number;
  action: (formData: FormData) => Promise<void>;
  deleteAssetAction: (formData: FormData) => Promise<void>;
  assetError?: string;
  blobConfigured: boolean;
}) {
  return (
    <div className="mt-5 space-y-8">
      <form action={action} className="space-y-6">
        <section>
          <h3 className="font-display text-xl">Palette de couleurs</h3>
          <div className="mt-2">
            <ListEditor
              name="palette"
              fields={[
                { key: "name", label: "Nom" },
                { key: "hex", label: "#hex" },
              ]}
              defaultItems={parse(identity?.palette, [])}
              addLabel="+ Ajouter une couleur"
            />
          </div>
        </section>

        <section>
          <h3 className="font-display text-xl">Typographies</h3>
          <div className="mt-2">
            <ListEditor
              name="fonts"
              fields={[
                { key: "name", label: "Police" },
                { key: "usage", label: "Usage (titre, texte…)" },
              ]}
              defaultItems={parse(identity?.fonts, [])}
              addLabel="+ Ajouter une police"
            />
          </div>
        </section>

        <label>
          <span className="field-label">Style d&apos;image</span>
          <textarea name="imageStyle" rows={2} defaultValue={identity?.imageStyle ?? ""} className="field" placeholder="Photo naturelle, lumière chaude, pas de flash…" />
        </label>
        <label>
          <span className="field-label">Règles d&apos;usage (interdits, marges, contrastes)</span>
          <textarea name="usageRules" rows={2} defaultValue={identity?.usageRules ?? ""} className="field" />
        </label>

        <SubmitButton label="Enregistrer l'identité" />
      </form>

      <section className="border-t border-line pt-6">
        <h3 className="font-display text-xl">Assets</h3>
        {!blobConfigured ? (
          <p className="card mt-3 border-danger p-4 text-sm text-danger">
            ⚠ Configure <code>BLOB_READ_WRITE_TOKEN</code>{" "}
            pour activer l&apos;upload d&apos;assets.
          </p>
        ) : (
          <form
            action={`/api/marques/${accountId}/assets`}
            method="POST"
            encType="multipart/form-data"
            className="card mt-3 grid gap-3 p-4 md:grid-cols-4"
          >
            <label>
              <span className="field-label">Type</span>
              <select name="type" className="field text-sm">
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Nom</span>
              <input name="name" className="field text-sm" placeholder="Logo principal" />
            </label>
            <label>
              <span className="field-label">Fichier</span>
              <input type="file" name="file" required className="field text-sm" />
            </label>
            <div className="md:col-span-4">
              <button type="submit" className="btn btn-accent">Envoyer l&apos;asset</button>
            </div>
          </form>
        )}
        {assetError && (
          <p className="card mt-3 border-danger p-3 text-sm text-danger">⚠ {decodeURIComponent(assetError)}</p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {assets.length === 0 && <p className="text-sm italic text-ink/40">Aucun asset pour l&apos;instant.</p>}
          {assets.map((a) => (
            <div key={a.id} className="card p-3">
              <p className="tag">{ASSET_TYPES.find((t) => t.value === a.type)?.label ?? a.type}</p>
              <p className="mt-1 truncate text-sm font-semibold">{a.name || "Sans nom"}</p>
              <form action={deleteAssetAction} className="mt-2">
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="text-xs font-semibold text-danger underline underline-offset-2">
                  Supprimer
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
