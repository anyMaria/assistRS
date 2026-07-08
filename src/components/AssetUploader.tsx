"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import type { PublicationAsset } from "@/db/schema";
import { enregistrerAssetSecours, reordonnerAssets, supprimerAsset } from "@/app/actions/publications";

const MAX_ASSETS = 10;

/** Upload transitoire de visuels (G14) — hébergement Blob public, purgé J+7 après envoi Buffer. */
export function AssetUploader({ publicationId, initialAssets }: { publicationId: number; initialAssets: PublicationAsset[] }) {
  const [items, setItems] = useState(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = MAX_ASSETS - items.length;
    if (room <= 0) {
      setError("Maximum 10 images atteint.");
      return;
    }
    const toUpload = Array.from(files).slice(0, room);
    setUploading(true);
    for (const file of toUpload) {
      try {
        const pathname = `publications/${publicationId}/${crypto.randomUUID()}-${file.name}`;
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/publications/upload",
          clientPayload: JSON.stringify({ publicationId }),
        });
        const res = await enregistrerAssetSecours(publicationId, blob.url, blob.pathname, file.size);
        if (res.ok) {
          setItems((prev) => (prev.some((a) => a.id === res.asset.id) ? prev : [...prev, res.asset]));
        } else {
          setError(res.error);
        }
      } catch (e) {
        console.error("[blob] upload échoué", e);
        setError("L'upload a échoué pour un ou plusieurs fichiers. Réessaie dans quelques minutes.");
      }
    }
    setUploading(false);
  }

  function move(id: number, dir: -1 | 1) {
    const idx = items.findIndex((a) => a.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
    const next = [...items];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setItems(next);
    reordonnerAssets(next.map((a) => a.id));
  }

  function remove(id: number) {
    setItems((prev) => prev.filter((a) => a.id !== id));
    supprimerAsset(id);
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {items.map((a, i) => (
            <div key={a.id} className="relative border-2 border-ink">
              {/* eslint-disable-next-line @next/next/no-img-element -- visuel Blob public, pas d'optimiseur Next possible */}
              <img src={a.url} alt="" className="h-24 w-24 object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-white/90 px-1 text-xs">
                <button type="button" onClick={() => move(a.id, -1)} disabled={i === 0} className="cursor-pointer disabled:opacity-30" aria-label="Déplacer vers la gauche">◀</button>
                <button type="button" onClick={() => remove(a.id)} className="cursor-pointer font-semibold text-danger" aria-label="Supprimer ce visuel">✕</button>
                <button type="button" onClick={() => move(a.id, 1)} disabled={i === items.length - 1} className="cursor-pointer disabled:opacity-30" aria-label="Déplacer vers la droite">▶</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className={`btn inline-block text-sm ${uploading || items.length >= MAX_ASSETS ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
        {uploading ? "Envoi…" : "+ Ajouter des visuels"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading || items.length >= MAX_ASSETS}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      <p className="text-xs text-ink/50">
        {items.length}/{MAX_ASSETS} images. Reels et vidéos : finalise-les directement dans Buffer.
      </p>
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
