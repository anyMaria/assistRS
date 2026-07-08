"use client";

import { useState } from "react";
import { envoyerSurBuffer } from "@/app/actions/buffer";

/** Envoie une publication planifiée directement sur Buffer (CONCEPTION.md, piste Ana du 07/07/2026). */
export function BufferButton({ publicationId }: { publicationId: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function envoyer() {
    setPending(true);
    setError(null);
    setWarning(null);
    try {
      const res = await envoyerSurBuffer(publicationId);
      if (res.ok) {
        setSent(true);
        if (res.warning) setWarning(res.warning);
      } else {
        setError(res.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={envoyer}
        disabled={pending}
        className="btn text-xs disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Envoi…" : "↗ Envoyer sur Buffer"}
      </button>
      {sent && <p className="mt-1 text-xs font-semibold text-ok">✓ Envoyée sur Buffer.</p>}
      {warning && (
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-warn">
          <span aria-hidden>⚠</span> {warning}
        </p>
      )}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-danger">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
