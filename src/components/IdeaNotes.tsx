"use client";

import { useState } from "react";
import { StickyNote, ChevronDown, ChevronUp, ArrowRight, Trash2 } from "lucide-react";
import type { Account, IdeaNote } from "@/db/schema";
import { IdeaForm } from "@/components/IdeaForm";

/**
 * Pense-bête d'idées (G12) : notes rapides en vrac, étape amont d'une vraie idée.
 * Bloc repliable au-dessus des vues d'/idees (rendu depuis /conception).
 */
export function IdeaNotes({
  notes,
  accounts,
  pillarsByAccount,
  addAction,
  deleteAction,
  convertAction,
  defaultOpen = false,
}: {
  notes: IdeaNote[];
  accounts: Account[];
  pillarsByAccount: Record<number, string[]>;
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: number) => Promise<void>;
  convertAction: (id: number, formData: FormData) => Promise<void>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || notes.length > 0);
  const [converting, setConverting] = useState<number | null>(null);
  const [text, setText] = useState("");

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    const fd = new FormData();
    fd.set("content", content);
    setText("");
    await addAction(fd);
  }

  return (
    <div className="mt-6 card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-2 p-3 text-left"
      >
        <StickyNote size={16} aria-hidden className="text-accent" />
        <span className="font-semibold">Pense-bête {notes.length > 0 && `(${notes.length})`}</span>
        <span className="ml-auto text-ink/40">
          {open ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
        </span>
      </button>

      {open && (
        <div className="border-t border-line p-3">
          <form onSubmit={quickAdd} className="mb-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Une idée en vrac, Entrée pour noter…"
              className="field flex-1"
            />
            <button type="submit" className="btn text-sm">Noter</button>
          </form>

          {notes.length === 0 ? (
            <p className="text-sm italic text-ink/40">Rien pour l&apos;instant — note une idée en vrac ci-dessus.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {notes.map((n) => (
                <div key={n.id} className="w-full max-w-xs rounded-lg bg-accent-soft p-3 text-sm sm:w-auto">
                  <p>{n.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setConverting(n.id)}
                      className="flex cursor-pointer items-center gap-1 font-semibold text-accent"
                    >
                      <ArrowRight size={12} aria-hidden /> En faire une idée
                    </button>
                    <form action={deleteAction.bind(null, n.id)}>
                      <button
                        type="submit"
                        aria-label="Supprimer cette note"
                        className="cursor-pointer text-ink/40 hover:text-danger"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {converting !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => setConverting(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="En faire une idée"
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5"
          >
            <h2 className="mb-4 font-display text-2xl">En faire une idée</h2>
            <IdeaForm
              accounts={accounts}
              pillarsByAccount={pillarsByAccount}
              defaultTitle={notes.find((n) => n.id === converting)?.content ?? ""}
              action={async (fd) => {
                await convertAction(converting, fd);
                setConverting(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
