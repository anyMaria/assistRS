"use client";

import { useState } from "react";
import { PLATFORMS } from "@/lib/constants";
import { EXPORT_FORMATS } from "@/lib/formats";

/** Décline une publication vers une autre plateforme + rappelle le bon format d'export (CONCEPTION.md §4.4). */
export function DeclinerForm({
  currentPlatform,
  action,
}: {
  currentPlatform: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string>(
    PLATFORMS.find((p) => p.value !== currentPlatform)?.value ?? PLATFORMS[0].value,
  );
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    try {
      await action(formData);
      setDone(target);
    } finally {
      setPending(false);
    }
  }

  const reminder = EXPORT_FORMATS.find((f) =>
    target === "linkedin" ? f.contenu.includes("LinkedIn") : f.contenu.includes("IG"),
  );

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-ink/60 underline underline-offset-2">
        Décliner vers…
      </button>
    );
  }

  return (
    <div className="card mt-2 p-3">
      <form action={submit} className="flex flex-wrap items-end gap-2">
        <label>
          <span className="field-label">Plateforme cible</span>
          <select
            name="platform"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="field text-sm"
          >
            {PLATFORMS.filter((p) => p.value !== currentPlatform).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending} className="btn btn-accent text-xs disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Déclinaison…" : "Confirmer"}
        </button>
      </form>
      {done && (
        <div className="mt-2 text-xs">
          <p className="font-semibold text-ok">✓ Copie créée pour {PLATFORMS.find((p) => p.value === done)?.label}.</p>
          {reminder && (
            <p className="mt-1 text-ink/60">
              Rappel de format : <strong>{reminder.format}</strong> — {reminder.dimensions}. Toujours ré-exporter
              depuis le fichier source, jamais convertir un export.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
