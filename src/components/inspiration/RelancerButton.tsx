"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { relancerRecherche } from "@/app/actions/inspiration";

export function RelancerButton({ searchId }: { searchId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function lancer(confirmer: boolean) {
    setPending(true);
    setError(null);
    const res = await relancerRecherche(searchId, confirmer);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      setNeedsConfirm(Boolean(res.requiresConfirmation));
      return;
    }
    setNeedsConfirm(false);
    const ids = new Set((searchParams.get("recherche") ?? "").split(",").filter(Boolean));
    ids.add(String(res.searchIds[0]));
    router.push(`/conception?onglet=inspirer&recherche=${Array.from(ids).join(",")}`);
  }

  return (
    <div className="text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => lancer(false)}
        className="flex items-center gap-1 font-semibold text-accent underline underline-offset-2"
      >
        <RefreshCw size={12} aria-hidden /> {pending ? "Relance…" : "Relancer"}
      </button>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-danger">
          <AlertTriangle size={12} aria-hidden /> {error}
        </p>
      )}
      {needsConfirm && (
        <button type="button" onClick={() => lancer(true)} className="btn btn-accent mt-1 text-xs">
          Lancer quand même
        </button>
      )}
    </div>
  );
}
