import { TrendingUp } from "lucide-react";
import type { RecallMatch } from "@/lib/recall";
import { formatRate } from "@/lib/kpi";
import { platformLabel, formatLabel, formatDate } from "@/lib/constants";

/** Encart « Ça avait bien marché » (CONCEPTION.md §4.3) — calculé côté serveur, sans appel réseau. */
export function RecallCard({ match }: { match: RecallMatch }) {
  return (
    <div className="card mt-4 border-ok p-3">
      <p className="field-label flex items-center gap-1 text-ok">
        <TrendingUp size={13} aria-hidden /> Ça avait bien marché
      </p>
      <p className="mt-1 text-sm">
        <strong>{match.title}</strong> — {platformLabel(match.platform)} · {formatLabel(match.format)} ·{" "}
        {formatDate(match.date)}
      </p>
      <p className="mt-1 text-sm text-ink/60">
        Taux d&apos;engagement : <strong>{formatRate(match.rate)}</strong> (au-dessus de la médiane de la marque)
      </p>
      {match.url && (
        <a href={match.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent underline">
          Voir la publication d&apos;origine
        </a>
      )}
    </div>
  );
}
