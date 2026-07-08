import type { BrandMemoryRule } from "@/db/schema";
import { formatDate } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function MemoireTab({
  rules,
  addAction,
  toggleAction,
  deleteAction,
  prefillRule,
  prefillOrigin,
}: {
  rules: BrandMemoryRule[];
  addAction: (formData: FormData) => Promise<void>;
  toggleAction: (id: number, active: boolean) => Promise<void>;
  deleteAction: (id: number) => Promise<void>;
  /** Pré-remplissage venu du bouton « Transformer en règle de mémoire » d'un retour client (G12). */
  prefillRule?: string;
  prefillOrigin?: string;
}) {
  return (
    <div className="mt-5 space-y-6">
      <p className="text-sm text-ink/60">
        Règles apprises des retouches d&apos;Ana, injectées dans tous les prompts IA de la marque
        (§4.2 « Mémoriser mes corrections »). Actives par défaut, désactivables sans les perdre.
      </p>

      <div className="space-y-2">
        {rules.length === 0 && <p className="text-sm italic text-ink/40">Aucune règle pour l&apos;instant.</p>}
        {rules.map((r) => (
          <div key={r.id} className={`card flex flex-wrap items-center gap-3 p-3 ${!r.active ? "opacity-50" : ""}`}>
            <p className="flex-1 text-sm">{r.rule}</p>
            <span className="text-xs text-ink/40">{r.origin}</span>
            <span className="text-xs text-ink/40">{formatDate(r.createdAt)}</span>
            <form action={toggleAction.bind(null, r.id, !r.active)}>
              <button type="submit" className="btn px-2 py-1 text-xs">
                {r.active ? "Désactiver" : "Activer"}
              </button>
            </form>
            <ConfirmDeleteButton action={deleteAction.bind(null, r.id)} confirmMessage="Supprimer cette règle ?" />
          </div>
        ))}
      </div>

      <form action={addAction} className="card flex flex-wrap items-end gap-3 p-4">
        <label className="flex-1">
          <span className="field-label">Nouvelle règle</span>
          <input
            name="rule"
            required
            defaultValue={prefillRule}
            className="field"
            placeholder="Ana remplace « N'hésitez pas à » par un impératif direct"
          />
        </label>
        <label>
          <span className="field-label">Origine</span>
          <input name="origin" defaultValue={prefillOrigin} className="field" placeholder="ajout manuel" />
        </label>
        <SubmitButton label="Ajouter la règle" />
      </form>
    </div>
  );
}
