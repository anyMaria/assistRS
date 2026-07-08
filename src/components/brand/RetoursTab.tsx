import Link from "next/link";
import type { BrandClientNote, Publication } from "@/db/schema";
import { formatDateTime, platformLabel } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

/**
 * Retours clients — verbatim archivé, distinct de la « Mémoire de corrections » (des
 * règles réutilisées par l'IA). Un retour peut être général ou lié à une publication.
 */
export function RetoursTab({
  accountId,
  notes,
  publications,
  addAction,
  deleteAction,
}: {
  accountId: number;
  notes: BrandClientNote[];
  publications: Pick<Publication, "id" | "title" | "platform">[];
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: number) => Promise<void>;
}) {
  const pubById = new Map(publications.map((p) => [p.id, p]));

  return (
    <div className="mt-5 space-y-6">
      <p className="text-sm text-ink/60">
        Les retours des clients sur les publications livrées, archivés tels quels. Pour
        transformer un retour récurrent en règle appliquée à l&apos;IA, utilise « Transformer en
        règle de mémoire » ci-dessous.
      </p>

      <form action={addAction} className="card space-y-3 p-4">
        <label>
          <span className="field-label">Retour du client</span>
          <textarea name="content" required rows={3} className="field" placeholder="Ce que le client a dit sur ce qui a été livré…" />
        </label>
        <label>
          <span className="field-label">À propos de la publication… (optionnel)</span>
          <select name="publicationId" defaultValue="" className="field">
            <option value="">— Retour général —</option>
            {publications.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || "(sans titre)"} — {platformLabel(p.platform)}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton label="Ajouter le retour" />
      </form>

      <div className="space-y-2">
        {notes.length === 0 && <p className="text-sm italic text-ink/40">Aucun retour pour l&apos;instant.</p>}
        {notes.map((n) => {
          const pub = n.publicationId ? pubById.get(n.publicationId) : undefined;
          const prefillUrl = `/marques/${accountId}?onglet=memoire&reglePreremplie=${encodeURIComponent(
            n.content,
          )}&origine=${encodeURIComponent(`retour client du ${formatDateTime(n.createdAt)}`)}`;
          return (
            <div key={n.id} className="card space-y-2 p-3">
              <p className="text-sm">{n.content}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink/40">
                <span>{formatDateTime(n.createdAt)}</span>
                {pub && (
                  <Link href="/planning" className="tag hover:bg-ink hover:text-white">
                    {pub.title || "(sans titre)"} — {platformLabel(pub.platform)}
                  </Link>
                )}
                <Link href={prefillUrl} className="font-semibold text-accent underline underline-offset-2">
                  Transformer en règle de mémoire
                </Link>
                <ConfirmDeleteButton action={deleteAction.bind(null, n.id)} confirmMessage="Supprimer ce retour ?" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
