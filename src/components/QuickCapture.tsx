"use client";

import { useEffect, useState } from "react";
import type { Account, Publication } from "@/db/schema";
import { IdeaForm } from "@/components/IdeaForm";
import { PublicationForm } from "@/components/PublicationForm";
import { SubmitButton } from "@/components/SubmitButton";
import { createIdea } from "@/app/actions/ideas";
import { createPublication } from "@/app/actions/publications";
import { addSnapshot } from "@/app/actions/publications";
import { createTimeEntry } from "@/app/actions/time-entries";
import { STAT_FIELDS, platformLabel } from "@/lib/constants";

type Kind = "idee" | "publication" | "releve" | "temps";

const ACTIONS: { kind: Kind; label: string; icon: string }[] = [
  { kind: "idee", label: "Nouvelle idée", icon: "☁" },
  { kind: "publication", label: "Nouvelle publication", icon: "▦" },
  { kind: "releve", label: "Relevé de stats", icon: "▁▃▅" },
  { kind: "temps", label: "Temps passé", icon: "◔" },
];

/** Capture rapide « + » : accessible partout, 4 actions courtes (CONCEPTION.md §2.1 transversal). */
export function QuickCapture({
  accounts,
  pillarsByAccount,
  publications,
}: {
  accounts: Account[];
  pillarsByAccount: Record<number, string[]>;
  publications: Pick<Publication, "id" | "accountId" | "title" | "platform">[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<Kind | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setActiveKind(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (accounts.length === 0) return null;

  function closeAll() {
    setMenuOpen(false);
    setActiveKind(null);
  }

  async function withClose(fn: (formData: FormData) => Promise<void>, formData: FormData) {
    await fn(formData);
    closeAll();
  }

  return (
    <>
      <div className="fixed right-4 bottom-40 md:right-6 md:bottom-6 z-40">
        {menuOpen && (
          <div className="mb-2 flex flex-col items-end gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.kind}
                type="button"
                onClick={() => {
                  setActiveKind(a.kind);
                  setMenuOpen(false);
                }}
                className="btn bg-white shadow-[3px_3px_0_var(--color-ink)] cursor-pointer"
              >
                <span aria-hidden>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Fermer la capture rapide" : "Capture rapide"}
          aria-expanded={menuOpen}
          className="flex h-14 w-14 items-center justify-center border-2 border-ink bg-accent text-2xl font-bold text-white shadow-[3px_3px_0_var(--color-ink)] transition hover:bg-[var(--color-accent-dark)] cursor-pointer"
        >
          <span aria-hidden>{menuOpen ? "✕" : "+"}</span>
        </button>
      </div>

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
            className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5 shadow-[4px_4px_0_var(--color-ink)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">
                {ACTIONS.find((a) => a.kind === activeKind)?.label}
              </h2>
              <button
                type="button"
                onClick={closeAll}
                aria-label="Fermer"
                className="text-ink/50 hover:text-ink cursor-pointer"
              >
                ✕
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
