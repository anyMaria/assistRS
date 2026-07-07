"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Enveloppe cliquable façon Notion : le contenu passé en `trigger` ouvre une fenêtre de
 * détail (`children`) au clic. `trigger` et `children` sont déjà rendus côté serveur
 * (peuvent contenir des formulaires liés à des server actions) — ce composant ne gère
 * que l'état d'ouverture, purement côté client.
 */
export function CardModal({
  trigger,
  title,
  children,
  triggerClassName = "",
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full cursor-pointer text-left transition hover:opacity-80 ${triggerClassName}`}
      >
        {trigger}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-5"
          >
            <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-3">
              <h2 className="font-display text-2xl italic">{title}</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="btn shrink-0 px-2 py-1 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

/** Liste label/valeur pour la fenêtre de détail — n'affiche que les champs renseignés. */
export function DetailFields({ fields }: { fields: { label: string; value: string }[] }) {
  const filled = fields.filter((f) => f.value);
  if (filled.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      {filled.map((f) => (
        <div key={f.label}>
          <dt className="field-label">{f.label}</dt>
          <dd className="mt-0.5">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
