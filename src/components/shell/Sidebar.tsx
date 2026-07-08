"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="hidden md:flex w-64 flex-none flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 6px 16px -8px color-mix(in srgb, var(--accent) 60%, transparent)" }}
        >
          <span className="font-display font-bold">A</span>
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">Assist RS</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ${
                active ? "bg-accent-soft text-accent" : "text-ink/60 hover:bg-paper-2 hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={2} aria-hidden />
              <span style={{ fontWeight: 550 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-xl bg-paper-2 px-3 py-2.5">
        <span
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-white text-xs font-semibold"
          style={{ background: "var(--gradient-accent)" }}
        >
          A
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm" style={{ fontWeight: 550 }}>Ana</p>
          <p className="truncate text-xs text-ink/50">Trinkets Design</p>
        </div>
      </div>
    </aside>
  );
}
