"use client";

import { useEffect, useRef, useState } from "react";
import { envoyerSemaineSurBuffer, type LigneRapportBuffer } from "@/app/actions/buffer";

export type SemaineCandidate = {
  id: number;
  label: string; // "{date} · {marque} · {plateforme} · {titre}"
  platform: string;
  hasVisual: boolean;
};

/** Bouton « Envoyer la semaine sur Buffer » — dialog de récap puis rapport ligne par ligne (G14 §5). */
export function EnvoyerSemaineButton({ candidates }: { candidates: SemaineCandidate[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [rapport, setRapport] = useState<LigneRapportBuffer[] | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setRapport(null);
    triggerRef.current?.focus();
  }

  async function confirmer() {
    setPending(true);
    const res = await envoyerSemaineSurBuffer(candidates.map((c) => c.id));
    setRapport(res);
    setPending(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        disabled={candidates.length === 0}
        className="btn text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Envoyer la semaine sur Buffer ({candidates.length})
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="envoyer-semaine-titre"
            className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-5"
          >
            <h2 id="envoyer-semaine-titre" className="font-display text-2xl">
              Envoyer {candidates.length} publication{candidates.length > 1 ? "s" : ""} sur Buffer
            </h2>

            {!rapport ? (
              <>
                <ul className="mt-4 space-y-2 text-sm">
                  {candidates.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-2 border-2 border-ink/20 p-2">
                      <span>{c.label}</span>
                      {!c.hasVisual && (
                        <span className="tag text-xs" style={{ borderColor: "var(--color-warn)", color: "var(--color-warn)" }}>
                          ⚠ sans visuel{c.platform === "instagram" ? " — échouera sur Instagram" : " — partira texte seul"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={close} className="btn text-sm">Annuler</button>
                  <button type="button" onClick={confirmer} disabled={pending} className="btn btn-accent text-sm">
                    {pending ? "Envoi…" : "Confirmer l'envoi"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <ul className="mt-4 space-y-2 text-sm">
                  {rapport.map((r) => (
                    <li key={r.id} className="flex items-start gap-2 border-2 border-ink/20 p-2">
                      <span className={r.ok ? "font-semibold text-ok" : "font-semibold text-danger"} aria-hidden>
                        {r.ok ? "✓" : "✗"}
                      </span>
                      <span>
                        <span className="font-semibold">{r.label}</span>
                        <span className="block text-xs text-ink/60">{r.message}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex justify-end">
                  <button type="button" onClick={close} className="btn btn-accent text-sm">Fermer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
