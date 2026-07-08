"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const items = navItems.filter((i) => i.mobile);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[58px] transition-colors ${
              active ? "text-accent" : "text-ink/50"
            }`}
          >
            <span
              className="flex h-8 w-12 items-center justify-center rounded-full transition-colors"
              style={{ background: active ? "var(--accent-soft)" : "transparent" }}
            >
              <Icon size={19} strokeWidth={2} aria-hidden />
            </span>
            <span className="text-[0.65rem]" style={{ fontWeight: 550 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
