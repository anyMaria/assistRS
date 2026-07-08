"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/app/api/recherche/route";

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  marque: "Marques",
  idee: "Idées",
  publication: "Publications",
  moodboard: "Moodboards",
  modele: "Modèles",
};

const TYPE_ORDER: SearchResult["type"][] = ["marque", "idee", "publication", "moodboard", "modele"];

function groupResults(results: SearchResult[]) {
  const groups = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: results.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);
  return groups;
}

/** Recherche globale ⌘K (et déclenchable via le bouton 🔍 mobile). */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }, []);

  // Raccourci global ⌘K / Ctrl+K.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Recherche débouncée.
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/recherche?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.ok ? data.results : []);
        setActiveIndex(0);
      } catch (e) {
        console.error("[recherche] échec côté client", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  const groups = groupResults(results);
  const flat = groups.flatMap((g) => g.items);

  function go(item: SearchResult) {
    router.push(item.href);
    close();
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[activeIndex]) go(flat[activeIndex]);
    }
  }

  return (
    <>
      {/* Bouton 🔍 mobile — déclenche la même recherche que ⌘K */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        className="md:hidden fixed right-4 bottom-24 z-40 flex h-12 w-12 items-center justify-center border border-line bg-white text-lg cursor-pointer"
      >
        <span aria-hidden>🔍</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[10vh]"
          onClick={close}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Recherche globale"
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-xl"
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span aria-hidden className="text-ink/40">⌘K</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Chercher une marque, une idée, une publication…"
                aria-label="Terme de recherche"
                className="w-full bg-transparent py-1 text-base outline-none"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Fermer la recherche"
                className="text-ink/50 hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {loading && (
                <p className="px-3 py-4 text-sm text-ink/50">Recherche…</p>
              )}
              {!loading && query.trim().length >= 2 && flat.length === 0 && (
                <p className="px-3 py-4 text-sm text-ink/50">Aucun résultat pour « {query} ».</p>
              )}
              {!loading && query.trim().length < 2 && (
                <p className="px-3 py-4 text-sm text-ink/50">
                  Tape au moins 2 caractères pour chercher parmi les marques, idées,
                  publications, moodboards et modèles.
                </p>
              )}
              {groups.map((group) => (
                <div key={group.type} className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const index = flat.indexOf(item);
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => go(item)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm cursor-pointer ${
                          index === activeIndex ? "bg-ink text-paper" : "hover:bg-ink/5"
                        }`}
                      >
                        <span className="font-semibold">{item.label}</span>
                        {item.meta && (
                          <span className={index === activeIndex ? "text-paper/60" : "text-ink/40"}>
                            {item.meta}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
