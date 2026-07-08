"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickCapture } from "@/components/QuickCapture";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Account, Publication } from "@/db/schema";

export function Topbar({
  accounts,
  pillarsByAccount,
  publications,
}: {
  accounts: Account[];
  pillarsByAccount: Record<number, string[]>;
  publications: Pick<Publication, "id" | "accountId" | "title" | "platform">[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="flex flex-none items-center gap-3 border-b border-line bg-surface/80 px-4 py-3 backdrop-blur md:px-8">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group flex flex-1 max-w-md items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-ink/50 transition-colors hover:border-ink/20 hover:text-ink cursor-pointer"
        >
          <Search size={16} aria-hidden />
          <span className="flex-1 text-left">Rechercher…</span>
          <kbd className="hidden sm:inline rounded-md border border-line px-1.5 text-xs">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setCaptureOpen(true)}
            className="btn btn-accent !min-h-0 gap-1 px-4 py-2.5"
          >
            <Plus size={18} aria-hidden />
            <span className="hidden sm:inline">Capturer</span>
          </button>
        </div>
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        accounts={accounts}
        pillarsByAccount={pillarsByAccount}
        publications={publications}
      />
    </>
  );
}
