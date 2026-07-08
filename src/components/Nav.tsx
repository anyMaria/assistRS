"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Accueil", short: "Accueil", icon: "◆" },
  { href: "/marques", label: "Marques", short: "Marques", icon: "▣" },
  { href: "/conception", label: "Conception", short: "Conception", icon: "✎" },
  { href: "/planning", label: "Planifier", short: "Planifier", icon: "▦" },
  { href: "/mesurer", label: "Mesurer", short: "Mesurer", icon: "▁▃▅" },
  { href: "/bilan", label: "Bilan", short: "Bilan", icon: "✉" },
  { href: "/parametres", label: "Paramètres", short: "Réglages", icon: "⚙" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Barre latérale — desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-line bg-paper z-40">
        <div className="border-b border-line px-5 py-5">
          <p className="font-display text-xl leading-tight">Trinkets Design</p>
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
        <div className="border-t border-line px-5 py-3 text-[10px] uppercase tracking-widest text-ink/40">
          fait main · {new Date().getFullYear()}
        </div>
      </aside>

      {/* Barre du bas — mobile (5 entrées principales, le reste via Paramètres) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t border-line bg-paper">
        {["/", "/conception", "/planning", "/mesurer", "/bilan"]
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
