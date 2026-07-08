"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { EXPORT_FORMATS } from "@/lib/formats";

/* Popover « Formats & dimensions » (GUIDELINE §4.4) — remplace l'ancienne section
   dédiée des Paramètres (G9) : accessible depuis le formulaire de publication et Créer. */
export function FormatsReference() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-line align-middle text-ink/60 hover:border-ink/40 hover:text-ink"
        aria-label="Formats & dimensions"
        title="Formats & dimensions"
      >
        <Info size={12} aria-hidden />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-80 border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="field-label">Formats &amp; dimensions</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="text-ink/50 hover:text-ink">
                <X size={14} aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              Toujours ré-exporter depuis le fichier source, jamais convertir un export.
            </p>
            <table className="mt-2 w-full text-xs">
              <tbody>
                {EXPORT_FORMATS.map((f) => (
                  <tr key={f.contenu} className="border-b border-ink/10">
                    <td className="py-1 pr-2 font-semibold">{f.contenu}</td>
                    <td className="py-1 pr-2">{f.format}</td>
                    <td className="py-1">{f.dimensions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </span>
  );
}
