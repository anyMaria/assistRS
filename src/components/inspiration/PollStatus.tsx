"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Interroge le statut d'une recherche Apify en cours et rafraîchit la page à la fin. */
export function PollStatus({ searchId }: { searchId: number }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/inspiration/statut?searchId=${searchId}`);
        const data = await res.json();
        if (!cancelled && data.status && data.status !== "en_cours") {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // silencieux : on retentera au prochain tick
      }
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [searchId, router]);

  return (
    <div className="flex items-center gap-2 p-5 text-sm text-ink/60">
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent" aria-hidden />
      Recherche en cours… (jusqu&apos;à 2 minutes)
    </div>
  );
}
