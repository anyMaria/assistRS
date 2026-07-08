"use client";

import { Copy } from "lucide-react";

/** Bouton-icône de duplication (G8 §2) — remplace les anciens liens texte « Dupliquer ». */
export function DuplicateButton({
  action,
  label = "Dupliquer",
  className = "btn-icon",
}: {
  action: (formData: FormData) => Promise<void>;
  label?: string;
  className?: string;
}) {
  return (
    <form action={action}>
      <button type="submit" aria-label={label} title={label} className={className}>
        <Copy size={14} aria-hidden />
      </button>
    </form>
  );
}
