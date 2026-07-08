import Link from "next/link";
import { Plus } from "lucide-react";
import { isNotNull } from "drizzle-orm";
import { db, accounts, moodboards, inspirationItems } from "@/db";
import { creerMoodboard, retirerDuMoodboard } from "@/app/actions/inspiration";
import { FormDialog } from "@/components/FormDialog";
import { SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

async function creerMoodboardAction(formData: FormData) {
  "use server";
  await creerMoodboard(formData);
}

export default async function MoodboardsPage() {
  const [allAccounts, boards, pinnedItems] = await Promise.all([
    db.select().from(accounts),
    db.select().from(moodboards),
    db.select().from(inspirationItems).where(isNotNull(inspirationItems.pinnedBoardId)),
  ]);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));
  const itemsByBoard = new Map<number, typeof pinnedItems>();
  for (const it of pinnedItems) {
    if (it.pinnedBoardId === null) continue;
    const list = itemsByBoard.get(it.pinnedBoardId) ?? [];
    list.push(it);
    itemsByBoard.set(it.pinnedBoardId, list);
  }

  return (
    <div>
      <SectionHeader
        title="Moodboards"
        subtitle="Les visuels épinglés depuis S'inspirer, par marque ou par thème."
        action={
          <FormDialog trigger={<><Plus size={16} aria-hidden /> Nouveau moodboard</>} title="Nouveau moodboard">
            <form action={creerMoodboardAction} className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="field-label">Nom *</span>
                <input name="name" required className="field" placeholder="Palette automne 2026" />
              </label>
              <label>
                <span className="field-label">Marque (optionnel)</span>
                <select name="accountId" defaultValue="" className="field">
                  <option value="">— libre / thématique —</option>
                  {allAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Thème (optionnel)</span>
                <input name="theme" className="field" placeholder="coulisses, artisanat…" />
              </label>
              <div className="md:col-span-3">
                <button type="submit" className="btn btn-accent">Créer le moodboard</button>
              </div>
            </form>
          </FormDialog>
        }
      />
      <p className="mt-4">
        <Link href="/conception?onglet=inspirer" className="text-sm font-semibold text-accent underline underline-offset-2">
          ← Retour à S&apos;inspirer
        </Link>
      </p>

      {boards.length === 0 ? (
        <p className="card mt-8 p-6 text-ink/60">
          Aucun moodboard pour l&apos;instant — épingle un visuel depuis{" "}
          <Link href="/conception?onglet=inspirer" className="font-semibold text-accent underline">
            S&apos;inspirer
          </Link>
          , ou crée-en un ci-dessus.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {boards.map((board) => {
            const boardItems = itemsByBoard.get(board.id) ?? [];
            const account = board.accountId ? accountById.get(board.accountId) : null;
            return (
              <section key={board.id} className="card">
                <header className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                  <h2 className="font-display text-2xl">{board.name}</h2>
                  <span className="tag">{account ? account.name : board.theme || "Libre"}</span>
                  <span className="ml-auto text-sm text-ink/50">{boardItems.length} visuel(s)</span>
                </header>
                {boardItems.length === 0 ? (
                  <p className="p-4 text-sm italic text-ink/50">Pas encore de visuel épinglé ici.</p>
                ) : (
                  <div className="columns-1 gap-4 p-4 sm:columns-2 lg:columns-3">
                    {boardItems.map((item) => {
                      const src = item.blobThumbUrl
                        ? `/api/blob/${encodeURIComponent(item.blobThumbUrl)}`
                        : item.imageUrl;
                      const remove = retirerDuMoodboard.bind(null, item.id);
                      return (
                        <div key={item.id} className="card mb-4 break-inside-avoid">
                          {/* eslint-disable-next-line @next/next/no-img-element -- image externe/blob privé */}
                          <img
                            src={src}
                            alt={item.author ? `Visuel de ${item.author}` : "Visuel épinglé"}
                            className="w-full border-b border-line"
                            loading="lazy"
                          />
                          <div className="flex items-center justify-between p-3 text-sm">
                            <span>{item.author || "Auteur inconnu"}</span>
                            <form action={remove}>
                              <button
                                type="submit"
                                className="text-xs font-semibold text-danger underline underline-offset-2"
                              >
                                Retirer
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
