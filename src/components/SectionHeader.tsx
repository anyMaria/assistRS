import type { ReactNode } from "react";

/** En-tête de page réutilisable (G8 §4) : titre display + sous-titre + zone d'action à droite. */
export function SectionHeader({
  title,
  subtitle,
  action,
  gradient = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Dégradé accent sur le titre — réservé à l'accueil. */
  gradient?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className={`font-display text-3xl md:text-4xl ${gradient ? "text-gradient" : ""}`}>{title}</h1>
        {subtitle && <p className="mt-1 text-ink/55">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
