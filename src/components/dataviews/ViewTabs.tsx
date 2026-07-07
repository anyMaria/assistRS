import Link from "next/link";
import type { ViewConfig } from "@/db/schema";

const TYPE_ICONS: Record<string, string> = {
  table: "☰",
  kanban: "▥",
  calendrier: "▦",
  galerie: "▨",
};

/** Sélecteur de vues sauvegardées (façon Notion), navigation par ?vue=<id> */
export function ViewTabs({
  views,
  activeId,
  basePath,
  extraParams = "",
  trailing,
}: {
  views: ViewConfig[];
  activeId: number;
  basePath: string;
  extraParams?: string;
  /** Remplace le lien statique « + Nouvelle vue » (G10 : popover inline). */
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b-2 border-ink">
      {views.map((v) => (
        <Link
          key={v.id}
          href={`${basePath}?vue=${v.id}${extraParams}`}
          className={`-mb-0.5 flex items-center gap-1.5 border-2 border-b-0 px-3 py-1.5 text-sm font-semibold ${
            v.id === activeId
              ? "border-ink bg-white"
              : "border-transparent text-ink/50 hover:text-ink"
          }`}
        >
          <span aria-hidden>{TYPE_ICONS[v.type] ?? "☰"}</span>
          {v.name}
        </Link>
      ))}
      {trailing}
    </div>
  );
}
