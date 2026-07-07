"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Tableau de bord", short: "Accueil", icon: "◆" },
  { href: "/creation", label: "Création", short: "Créer", icon: "✎" },
  { href: "/idees", label: "Idées", short: "Idées", icon: "☁" },
  { href: "/planning", label: "Planning", short: "Planning", icon: "▦" },
  { href: "/s-inspirer", label: "S'inspirer", short: "Inspirer", icon: "✺" },
  { href: "/programmation", label: "Horaires", short: "Horaires", icon: "◔" },
  { href: "/statistiques", label: "Statistiques", short: "Stats", icon: "▁▃▅" },
  { href: "/analyse", label: "Analyse", short: "Analyse", icon: "◎" },
  { href: "/bilan", label: "Bilan", short: "Bilan", icon: "✉" },
  { href: "/rituel", label: "Rituel mensuel", short: "Rituel", icon: "☾" },
  { href: "/comptes", label: "Comptes", short: "Comptes", icon: "▣" },
  { href: "/parametres", label: "Paramètres", short: "Réglages", icon: "⚙" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Barre latérale — desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r-2 border-ink bg-paper z-40">
        <div className="border-b-2 border-ink px-5 py-5">
          <p className="font-display text-xl italic leading-tight">Trinkets Design</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-ink/50">
            Assistant RS
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm font-semibold transition ${
                isActive(item.href)
                  ? "bg-ink text-paper"
                  : "text-ink/70 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <span className="w-5 text-center text-xs" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t-2 border-ink px-5 py-3 text-[10px] uppercase tracking-widest text-ink/40">
          fait main · {new Date().getFullYear()}
        </div>
      </aside>

      {/* Barre du bas — mobile (5 entrées principales, le reste via Paramètres) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t-2 border-ink bg-paper">
        {["/", "/bilan", "/planning", "/statistiques", "/parametres"]
          .map((href) => items.find((item) => item.href === href)!)
          .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
              isActive(item.href) ? "bg-ink text-paper" : "text-ink/70"
            }`}
          >
            <span className="text-sm leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.short}
          </Link>
        ))}
      </nav>
    </>
  );
}
