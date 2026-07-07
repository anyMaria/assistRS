"use client";

import { useState } from "react";
import type { InspirationItem, Moodboard } from "@/db/schema";
import { epinglerItem, creerMoodboard } from "@/app/actions/inspiration";
import { createIdea } from "@/app/actions/ideas";
import { signalText, type ApifySource } from "@/lib/apify";

export function ItemCard({
  item,
  moodboards,
  accountId,
  theme,
}: {
  item: InspirationItem;
  moodboards: Moodboard[];
  accountId: number | null;
  theme?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const metrics = JSON.parse(item.metrics) as Record<string, unknown>;
  const src = item.blobThumbUrl ? `/api/blob/${encodeURIComponent(item.blobThumbUrl)}` : item.imageUrl;
  const pinned = item.pinnedBoardId !== null;

  async function epingler(moodboardId: number) {
    setPending(true);
    await epinglerItem(item.id, moodboardId);
    setPending(false);
    setOpen(false);
  }

  return (
    <div className="card mb-4 break-inside-avoid">
      {/* eslint-disable-next-line @next/next/no-img-element -- image externe (scraping) ou blob privé, pas d'optimiseur Next possible */}
      <img
        src={src}
        alt={item.author ? `Visuel d'inspiration de ${item.author}` : "Visuel d'inspiration"}
        className="w-full border-b-2 border-ink"
        loading="lazy"
      />
      <div className="space-y-2 p-3 text-sm">
        <p className="font-semibold">{item.author || "Auteur inconnu"}</p>
        <p className="text-ink/60">{signalText(item.source as ApifySource, metrics)}</p>
        <div className="flex flex-wrap items-center gap-2">
          {item.originalUrl && (
            <a
              href={item.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-accent underline underline-offset-2"
            >
              Voir l&apos;original
            </a>
          )}
          {accountId && (
            <form action={createIdea}>
              <input type="hidden" name="accountId" value={accountId} />
              <input type="hidden" name="title" value={`Inspiration${item.author ? ` — ${item.author}` : ""}`} />
              <input type="hidden" name="theme" value={theme ?? ""} />
              <input type="hidden" name="content" value={item.originalUrl || item.imageUrl} />
              <input type="hidden" name="source" value="manuelle" />
              <button type="submit" className="btn text-xs">＋ En faire une idée</button>
            </form>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`btn ml-auto text-xs ${pinned ? "bg-ink text-white" : ""}`}
          >
            {pinned ? "✓ Épinglé" : "Épingler"}
          </button>
        </div>
        {open && (
          <div className="space-y-2 border-t-2 border-ink pt-2">
            {moodboards.length === 0 && (
              <p className="text-xs text-ink/50">Aucun moodboard — crées-en un ci-dessous.</p>
            )}
            {moodboards.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={pending}
                onClick={() => epingler(m.id)}
                className="btn w-full text-xs"
              >
                {m.name}
              </button>
            ))}
            <NewMoodboardMiniForm
              accountId={accountId}
              onCreated={async (id) => epingler(id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NewMoodboardMiniForm({
  accountId,
  onCreated,
}: {
  accountId: number | null;
  onCreated: (moodboardId: number) => void;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor={`nouveau-moodboard`}>Nom du nouveau moodboard</label>
      <input
        id="nouveau-moodboard"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nouveau moodboard…"
        className="field text-xs"
      />
      <button
        type="button"
        disabled={pending || !name.trim()}
        onClick={async () => {
          setPending(true);
          setError(null);
          const fd = new FormData();
          fd.set("name", name.trim());
          if (accountId) fd.set("accountId", String(accountId));
          const res = await creerMoodboard(fd);
          setPending(false);
          if (res.ok) {
            setName("");
            onCreated(res.id);
          } else {
            setError(res.error);
          }
        }}
        className="btn btn-accent text-xs"
      >
        Créer
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
