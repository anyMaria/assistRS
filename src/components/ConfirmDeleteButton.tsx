"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

/**
 * Bouton de suppression avec confirmation (G8 §2) — remplace les anciens liens texte
 * soulignés « Supprimer ». `confirm()` natif : simple, accessible, suffisant ici.
 * Icône seule par défaut ; passer `children` pour un bouton libellé (actions rares et
 * lourdes de conséquences, ex. suppression d'une marque entière).
 */
export function ConfirmDeleteButton({
  action,
  confirmMessage = "Supprimer définitivement ?",
  label = "Supprimer",
  className = "btn-icon btn-icon-danger",
  children,
  hiddenFields,
}: {
  action: (formData: FormData) => Promise<void>;
  confirmMessage?: string;
  label?: string;
  className?: string;
  children?: ReactNode;
  /** Champs cachés du formulaire, pour les actions non pré-liées via .bind(). */
  hiddenFields?: Record<string, string | number>;
}) {
  return (
    <form action={action}>
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm(confirmMessage)) e.preventDefault();
        }}
        aria-label={children ? undefined : label}
        title={children ? undefined : label}
        className={className}
      >
        <Trash2 size={14} aria-hidden />
        {children}
      </button>
    </form>
  );
}
