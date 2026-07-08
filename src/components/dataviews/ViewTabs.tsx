import Link from "next/link";
import { Table2, Kanban, CalendarDays, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ViewConfig } from "@/db/schema";

const TYPE_ICONS: Record<string, LucideIcon> = {
  table: Table2,
  kanban: Kanban,
  calendrier: CalendarDays,
  galerie: LayoutGrid,
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
    <div className="flex flex-wrap items-center gap-1 border-b border-line">
      {views.map((v) => {
        const Icon = TYPE_ICONS[v.type] ?? Table2;
        return (
          <Link
            key={v.id}
            href={`${basePath}?vue=${v.id}${extraParams}`}
            className={`-mb-0.5 flex items-center gap-1.5 border border-b-0 px-3 py-1.5 text-sm font-semibold ${
              v.id === activeId
                ? "border-line bg-surface text-ink"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            <Icon size={15} aria-hidden />
            {v.name}
          </Link>
        );
      })}
      {trailing}
    </div>
  );
}
