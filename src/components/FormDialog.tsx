"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Bouton qui ouvre un panneau (Dialog) contenant un formulaire déjà rendu côté serveur
 * (G8 §2) — remplace les anciens accordéons <details>/<summary>. `trigger` et `children`
 * peuvent contenir des formulaires liés à des server actions.
 */
export function FormDialog({
  trigger,
  title,
  children,
  triggerClassName = "btn btn-accent",
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {trigger}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl">{title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="btn-icon shrink-0">
                <X size={16} aria-hidden />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
