"use client";

import { useState } from "react";
import { envoyerSurBuffer } from "@/app/actions/buffer";

/** Envoie une publication planifiée directement sur Buffer (CONCEPTION.md, piste Ana du 07/07/2026). */
export function BufferButton({ publicationId }: { publicationId: number }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<"ok" | string | null>(null);

  async function envoyer() {
    setPending(true);
    setResult(null);
    try {
      const res = await envoyerSurBuffer(publicationId);
      setResult(res.ok ? "ok" : res.error);
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
      {result === "ok" && <p className="mt-1 text-xs font-semibold text-ok">✓ Envoyée sur Buffer.</p>}
      {result && result !== "ok" && <p className="mt-1 text-xs font-semibold text-danger">{result}</p>}
    </div>
  );
}
