import { db, viewConfigs, colorRules, csvMappings } from "@/db";
import {
  createView,
  deleteView,
  updateViewSettings,
  createColorRule,
  deleteColorRule,
  deleteCsvMapping,
} from "@/app/actions/settings";
import { ColorRuleForm } from "@/components/ColorRuleForm";
import { ViewSettingsForm } from "@/components/ViewSettingsForm";
import { SubmitButton } from "@/components/SubmitButton";
import { RULE_FIELDS, operatorLabel } from "@/lib/color-rules";
import { EXPORT_FORMATS } from "@/lib/formats";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  table: "Table",
  kanban: "Kanban",
  calendrier: "Calendrier",
  galerie: "Galerie",
};
const ENTITY_LABEL: Record<string, string> = { idees: "Idées", publications: "Publications" };

export default async function ParametresPage() {
  const views = await db.select().from(viewConfigs);
  const rules = await db.select().from(colorRules);
  const mappings = await db.select().from(csvMappings);

  return (
    <div>
      <h1 className="font-display text-4xl italic">Paramètres</h1>
      <p className="mt-1 text-ink/60">Vues, couleurs conditionnelles, mappings CSV et formats d&apos;export.</p>

      {/* ——— Vues ——— */}
      <section id="vues" className="mt-8 scroll-mt-6">
        <h2 className="font-display text-2xl">Vues sauvegardées</h2>
        <div className="mt-3 space-y-2">
          {views.map((v) => (
            <details key={v.id} className="card">
              <summary className="flex cursor-pointer items-center gap-3 p-3">
                <span className="tag">{ENTITY_LABEL[v.entity] ?? v.entity}</span>
                <span className="tag">{TYPE_LABEL[v.type] ?? v.type}</span>
                <span className="font-semibold">{v.name}</span>
                <span className="ml-auto text-xs text-ink/40">⚙ réglages</span>
                <form action={deleteView.bind(null, v.id)}>
                  <button type="submit" className="text-sm font-semibold text-danger underline underline-offset-2">
                    Supprimer
                  </button>
                </form>
              </summary>
              <ViewSettingsForm view={v} action={updateViewSettings.bind(null, v.id)} />
            </details>
          ))}
        </div>
        <details className="card mt-4">
          <summary className="cursor-pointer p-4 font-display text-xl">+ Nouvelle vue</summary>
          <form action={createView} className="grid gap-3 border-t-2 border-ink p-5 md:grid-cols-4">
            <label>
              <span className="field-label">Entité</span>
              <select name="entity" required className="field text-sm">
                <option value="idees">Idées</option>
                <option value="publications">Publications</option>
              </select>
            </label>
            <label>
              <span className="field-label">Type</span>
              <select name="type" required className="field text-sm">
                <option value="table">Table</option>
                <option value="kanban">Kanban</option>
                <option value="calendrier">Calendrier</option>
                <option value="galerie">Galerie</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Nom</span>
              <input name="name" required className="field text-sm" placeholder="Ma vue" />
            </label>
            <div className="md:col-span-4">
              <SubmitButton label="Créer la vue" />
            </div>
          </form>
        </details>
      </section>

      {/* ——— Couleurs conditionnelles ——— */}
      <section id="couleurs" className="mt-10 scroll-mt-6">
        <h2 className="font-display text-2xl">Couleurs conditionnelles</h2>
        <div className="mt-3 space-y-2">
          {rules.length === 0 && <p className="text-ink/50 italic">Aucune règle pour l&apos;instant.</p>}
          {rules.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-2 p-3">
              <span className="h-4 w-4 border border-ink" style={{ backgroundColor: r.color }} />
              <span className="tag">{ENTITY_LABEL[r.entity] ?? r.entity}</span>
              <span className="text-sm">
                {r.field} {operatorLabel(r.operator)} <strong>{r.value}</strong>
              </span>
              {r.label && <span className="text-xs text-ink/50">« {r.label} »</span>}
              <form action={deleteColorRule.bind(null, r.id)} className="ml-auto">
                <button type="submit" className="text-sm font-semibold text-danger underline underline-offset-2">
                  Supprimer
                </button>
              </form>
            </div>
          ))}
        </div>
        <details className="card mt-4">
          <summary className="cursor-pointer p-4 font-display text-xl">+ Règle pour les idées</summary>
          <div className="border-t-2 border-ink p-5">
            <ColorRuleForm entity="idees" fields={RULE_FIELDS.idees} action={createColorRule} />
          </div>
        </details>
        <details className="card mt-3">
          <summary className="cursor-pointer p-4 font-display text-xl">+ Règle pour les publications</summary>
          <div className="border-t-2 border-ink p-5">
            <ColorRuleForm entity="publications" fields={RULE_FIELDS.publications} action={createColorRule} />
          </div>
        </details>
      </section>

      {/* ——— Mappings CSV ——— */}
      <section id="mappings" className="mt-10 scroll-mt-6">
        <h2 className="font-display text-2xl">Mappings CSV</h2>
        <p className="mt-1 text-sm text-ink/50">
          Réutilisés lors de l&apos;import de statistiques (bloc Mesurer+).
        </p>
        <div className="mt-3 space-y-2">
          {mappings.length === 0 && (
            <p className="text-ink/50 italic">Aucun mapping enregistré pour l&apos;instant.</p>
          )}
          {mappings.map((m) => (
            <div key={m.id} className="card flex items-center gap-3 p-3">
              <span className="font-semibold">{m.name}</span>
              <form action={deleteCsvMapping.bind(null, m.id)} className="ml-auto">
                <button type="submit" className="text-sm font-semibold text-danger underline underline-offset-2">
                  Supprimer
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Formats d'export ——— */}
      <section id="formats" className="mt-10 scroll-mt-6">
        <h2 className="font-display text-2xl">Formats d&apos;export</h2>
        <p className="mt-1 text-sm text-ink/50">
          Toujours ré-exporter depuis le fichier source, jamais convertir un export. L&apos;app ne
          convertit aucun fichier.
        </p>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="p-3">Contenu</th>
                <th className="p-3">Format d&apos;export</th>
                <th className="p-3">Dimensions</th>
              </tr>
            </thead>
            <tbody>
              {EXPORT_FORMATS.map((f) => (
                <tr key={f.contenu} className="border-b border-ink/10">
                  <td className="p-3 font-semibold">{f.contenu}</td>
                  <td className="p-3">{f.format}</td>
                  <td className="p-3">{f.dimensions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
