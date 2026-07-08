"use client";

import { useEffect, useState } from "react";
import { X, Lightbulb, CalendarDays, BarChart3, Clock, StickyNote } from "lucide-react";
import type { Account, Publication } from "@/db/schema";
import { IdeaForm } from "@/components/IdeaForm";
import { PublicationForm } from "@/components/PublicationForm";
import { SubmitButton } from "@/components/SubmitButton";
import { createIdea, addIdeaNote } from "@/app/actions/ideas";
import { createPublication } from "@/app/actions/publications";
import { addSnapshot } from "@/app/actions/publications";
import { createTimeEntry } from "@/app/actions/time-entries";
import { STAT_FIELDS, platformLabel } from "@/lib/constants";

type Kind = "idee" | "publication" | "releve" | "temps" | "note";

const ACTIONS: { kind: Kind; label: string; icon: typeof Lightbulb }[] = [
  { kind: "idee", label: "Nouvelle idée", icon: Lightbulb },
  { kind: "publication", label: "Nouvelle publication", icon: CalendarDays },
  { kind: "releve", label: "Relevé de stats", icon: BarChart3 },
  { kind: "temps", label: "Temps passé", icon: Clock },
  { kind: "note", label: "Note pense-bête", icon: StickyNote },
];

/** Capture rapide : accessible depuis le bouton « Capturer » de la topbar, 4 actions courtes. */
export function QuickCapture({
  open,
  onClose,
  accounts,
  pillarsByAccount,
  publications,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  pillarsByAccount: Record<number, string[]>;
  publications: Pick<Publication, "id" | "accountId" | "title" | "platform">[];
}) {
  const [activeKind, setActiveKind] = useState<Kind | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closeAll ne fait qu'appeler des setters stables
  }, []);

  if (accounts.length === 0) return null;

  function closeAll() {
    setActiveKind(null);
    onClose();
  }

  async function withClose(fn: (formData: FormData) => Promise<void>, formData: FormData) {
    await fn(formData);
    closeAll();
  }

  return (
    <>
      {open && !activeKind && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[10vh]"
          onClick={closeAll}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Capture rapide"
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-sm space-y-2 p-3"
          >
            {ACTIONS.map((a) => (
              <button
                key={a.kind}
                type="button"
                onClick={() => setActiveKind(a.kind)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-paper-2"
              >
                <a.icon size={18} aria-hidden className="text-accent" />
                <span style={{ fontWeight: 550 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeKind && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          onClick={closeAll}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ACTIONS.find((a) => a.kind === activeKind)?.label}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">
                {ACTIONS.find((a) => a.kind === activeKind)?.label}
              </h2>
              <button
                type="button"
                onClick={closeAll}
                aria-label="Fermer"
                className="btn-icon"
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            {activeKind === "idee" && (
              <IdeaForm
                accounts={accounts}
                pillarsByAccount={pillarsByAccount}
                action={(fd) => withClose(createIdea, fd)}
              />
            )}

            {activeKind === "publication" && (
              <PublicationForm
                accounts={accounts}
                action={(fd) => withClose(createPublication, fd)}
                submitLabel="Ajouter la publication"
              />
            )}

            {activeKind === "releve" && (
              <ReleveQuickForm
                accounts={accounts}
                publications={publications}
                onDone={closeAll}
              />
            )}

            {activeKind === "temps" && (
              <form action={(fd) => withClose(createTimeEntry, fd)} className="grid gap-4 md:grid-cols-3">
                <label>
                  <span className="field-label">Marque *</span>
                  <select name="accountId" required defaultValue={accounts[0]?.id} className="field">
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Minutes *</span>
                  <input type="number" name="minutes" required min={1} inputMode="numeric" className="field" placeholder="30" />
                </label>
                <label>
                  <span className="field-label">Note</span>
                  <input name="note" className="field" placeholder="Rédaction légendes, retouches…" />
                </label>
                <div className="md:col-span-3">
                  <SubmitButton label="Enregistrer le temps" />
                </div>
              </form>
            )}

            {activeKind === "note" && (
              <form action={(fd) => withClose(addIdeaNote, fd)} className="grid gap-4">
                <label>
                  <span className="field-label">Note *</span>
                  <textarea name="content" required rows={3} className="field" placeholder="Une idée en vrac, à retrouver dans le pense-bête d'/idées…" />
                </label>
                <label>
                  <span className="field-label">Marque (optionnel)</span>
                  <select name="accountId" defaultValue="" className="field">
                    <option value="">— Générale —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </label>
                <SubmitButton label="Noter" />
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ReleveQuickForm({
  accounts,
  publications,
  onDone,
}: {
  accounts: Account[];
  publications: Pick<Publication, "id" | "accountId" | "title" | "platform">[];
  onDone: () => void;
}) {
  const [accountId, setAccountId] = useState<number>(accounts[0]?.id ?? 0);
  const filtered = publications.filter((p) => p.accountId === accountId);

  async function action(formData: FormData) {
    await addSnapshot(formData);
    onDone();
  }

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="field-label">Marque *</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(Number(e.target.value))}
            className="field"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Publication *</span>
          {filtered.length > 0 ? (
            <select name="publicationId" required className="field">
              {filtered.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || "(sans titre)"} — {platformLabel(p.platform)}
                </option>
              ))}
            </select>
          ) : (
            <input className="field" disabled placeholder="Aucune publication pour cette marque" />
          )}
        </label>
      </div>
      {filtered.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
            {STAT_FIELDS.map((f) => (
              <label key={f.value}>
                <span className="field-label">{f.label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  name={f.value}
                  min={f.value === "followersGained" ? undefined : 0}
                  placeholder="0"
                  className="field"
                />
              </label>
            ))}
          </div>
          <SubmitButton label="Enregistrer le relevé" />
        </>
      )}
    </form>
  );
}
