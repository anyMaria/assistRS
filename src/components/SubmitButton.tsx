"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";

/** Bouton de soumission partagé : état de chargement + feedback « ✓ Enregistré ». */
export function SubmitButton({
  label,
  loadingLabel = "Enregistrement…",
  accent = true,
  className = "",
}: {
  label: string;
  loadingLabel?: string;
  accent?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const [prevPending, setPrevPending] = useState(pending);
  const [justSaved, setJustSaved] = useState(false);

  // Ajustement pendant le rendu (pas dans un effet) : on détecte la transition
  // pending → false, qui signale la fin d'une soumission réussie.
  if (pending !== prevPending) {
    setPrevPending(pending);
    setJustSaved(!pending);
  }

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(t);
  }, [justSaved]);

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn ${accent ? "btn-accent" : ""} ${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? loadingLabel : justSaved ? "✓ Enregistré" : label}
    </button>
  );
}
