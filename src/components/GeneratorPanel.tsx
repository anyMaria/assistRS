"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import type { Account } from "@/db/schema";
import { IdeaGeneratorForm } from "@/components/IdeaGeneratorForm";
import { FormatsReference } from "@/components/FormatsReference";

/**
 * Générateur d'idées IA en panneau (G15) — remplace l'ancien onglet « Créer ». Seul
 * bouton accent de l'écran (règle maquette). S'ouvre aussi via l'URL `?generer=1`
 * (redirections depuis /creer et ?onglet=creer).
 */
export function GeneratorPanel({ accounts, defaultOpen }: { accounts: Account[]; defaultOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close ne dépend que de setOpen/router, stables
  }, [open]);

  function close() {
    setOpen(false);
    router.refresh();
  }

  if (accounts.length === 0) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-accent">
        <Sparkles size={16} aria-hidden /> Générer des idées
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-0 sm:p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Générer des idées"
            onClick={(e) => e.stopPropagation()}
            className="card h-full w-full overflow-y-auto p-5 sm:h-auto sm:max-h-[85vh] sm:max-w-3xl"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl">Générer des idées</h2>
              <button type="button" onClick={close} aria-label="Fermer" className="btn-icon shrink-0">
                <X size={16} aria-hidden />
              </button>
            </div>
            <IdeaGeneratorForm accounts={accounts} />
            <p className="mt-4 flex items-center text-sm text-ink/50">
              Formats &amp; dimensions par plateforme <FormatsReference />
            </p>
          </div>
        </div>
      )}
    </>
  );
}
