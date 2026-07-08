"use client";

import { useState } from "react";
import { RefreshCw, Check, AlertTriangle } from "lucide-react";
import { synchroniserStatsBufferAction } from "@/app/actions/buffer";

/** Bouton de synchro manuelle des stats Buffer (G11 §2) — même logique que le cron. */
export function SyncBufferButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function synchroniser() {
    setPending(true);
    setMessage(null);
    try {
      const res = await synchroniserStatsBufferAction();
      if (res.ok) {
        setMessage({
          ok: true,
          text:
            res.created > 0
              ? `${res.created} relevé${res.created > 1 ? "s" : ""} créé${res.created > 1 ? "s" : ""}.`
              : "À jour — rien de nouveau depuis Buffer.",
        });
      } else {
        setMessage({ ok: false, text: res.error });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={synchroniser} disabled={pending} className="btn text-sm">
        <RefreshCw size={14} aria-hidden className={pending ? "animate-spin" : undefined} />
        {pending ? "Synchronisation…" : "Synchroniser Buffer"}
      </button>
      {message && (
        <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${message.ok ? "text-ok" : "text-danger"}`}>
          {message.ok ? <Check size={12} aria-hidden /> : <AlertTriangle size={12} aria-hidden />}
          {message.text}
        </p>
      )}
    </div>
  );
}
