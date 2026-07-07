"use client";

import { useState } from "react";
import { appliquerLegende, enregistrerRegles } from "@/app/actions/ai";

type Props = {
  kind: "idee" | "publication";
  id: number;
  accountId: number;
  platform: string;
  format: string;
  brief: string;
  existingText: string;
  platformLabel: string;
};

/** Éditeur inline de légende IA — génération, édition, application et mémoire de corrections (CONCEPTION.md §4.2). */
export function LegendeEditor({ kind, id, accountId, platform, format, brief, existingText, platformLabel }: Props) {
  const [texte, setTexte] = useState(existingText);
  const [original, setOriginal] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [loading, setLoading] = useState<"redaction" | "amelioration" | "application" | "memoire" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [regles, setRegles] = useState<string[] | null>(null);
  const [reglesCochees, setReglesCochees] = useState<Set<number>>(new Set());
  const [reglesEnregistrees, setReglesEnregistrees] = useState(false);

  async function rediger() {
    setLoading("redaction");
    setError(null);
    try {
      const res = await fetch("/api/ia/legende", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          platform,
          format,
          brief,
          ideaId: kind === "idee" ? id : undefined,
          publicationId: kind === "publication" ? id : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setTexte(data.texte);
      setOriginal(data.texte);
      setGenerationId(data.generationId);
      setApplied(false);
      setRegles(null);
      setReglesEnregistrees(false);
    } catch {
      setError("L'IA est indisponible pour l'instant. Réessaie dans quelques minutes.");
    } finally {
      setLoading(null);
    }
  }

  async function ameliorer() {
    setLoading("amelioration");
    setError(null);
    try {
      const res = await fetch("/api/ia/ameliorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, texte }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setTexte(data.texte);
    } catch {
      setError("L'IA est indisponible pour l'instant. Réessaie dans quelques minutes.");
    } finally {
      setLoading(null);
    }
  }

  async function appliquer() {
    if (generationId === null) return;
    setLoading("application");
    try {
      await appliquerLegende(kind, id, generationId, texte);
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    } finally {
      setLoading(null);
    }
  }

  async function memoriser() {
    if (original === null) return;
    setLoading("memoire");
    setError(null);
    try {
      const res = await fetch("/api/ia/memoriser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, corrige: texte }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setRegles(data.regles);
      setReglesCochees(new Set((data.regles as string[]).map((_, i) => i)));
    } catch {
      setError("L'IA est indisponible pour l'instant. Réessaie dans quelques minutes.");
    } finally {
      setLoading(null);
    }
  }

  async function enregistrerReglesCochees() {
    if (!regles) return;
    const choisies = regles.filter((_, i) => reglesCochees.has(i));
    const today = new Date().toLocaleDateString("fr-FR");
    await enregistrerRegles(accountId, `correction du ${today} sur légende ${platformLabel}`, choisies);
    setReglesEnregistrees(true);
    setRegles(null);
  }

  return (
    <div className="mt-4 border-t-2 border-ink pt-4">
      <p className="field-label">Légende</p>

      {error && (
        <div className="card mt-2 border-danger p-3 text-sm text-danger">⚠ {error}</div>
      )}

      {texte ? (
        <>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={5}
            className="field mt-2"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={appliquer} disabled={loading !== null || generationId === null} className="btn btn-accent text-xs disabled:cursor-not-allowed disabled:opacity-60">
              {loading === "application" ? "Enregistrement…" : applied ? "✓ Appliqué" : "↵ Appliquer"}
            </button>
            <button type="button" onClick={ameliorer} disabled={loading !== null} className="btn text-xs disabled:cursor-not-allowed disabled:opacity-60">
              {loading === "amelioration" ? "Amélioration…" : "✨ Améliorer mon texte"}
            </button>
            {original !== null && (
              <button type="button" onClick={memoriser} disabled={loading !== null} className="btn text-xs disabled:cursor-not-allowed disabled:opacity-60">
                {loading === "memoire" ? "Analyse…" : "🧠 Mémoriser mes corrections"}
              </button>
            )}
            <button type="button" onClick={rediger} disabled={loading !== null} className="text-xs font-semibold text-ink/60 underline underline-offset-2">
              Regénérer
            </button>
          </div>
        </>
      ) : (
        <button type="button" onClick={rediger} disabled={loading !== null} className="btn btn-accent mt-2 text-xs disabled:cursor-not-allowed disabled:opacity-60">
          {loading === "redaction" ? "Rédaction…" : "✎ Rédiger la légende"}
        </button>
      )}

      {regles && regles.length > 0 && (
        <div className="card mt-3 p-3">
          <p className="field-label">Règles proposées — à confirmer</p>
          <div className="mt-1 space-y-1">
            {regles.map((r, i) => (
              <label key={i} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={reglesCochees.has(i)}
                  onChange={(e) => {
                    const next = new Set(reglesCochees);
                    if (e.target.checked) next.add(i);
                    else next.delete(i);
                    setReglesCochees(next);
                  }}
                  className="mt-1 h-4 w-4 accent-[#1C1917]"
                />
                {r}
              </label>
            ))}
          </div>
          <button type="button" onClick={enregistrerReglesCochees} className="btn btn-accent mt-2 text-xs">
            Ajouter à la mémoire
          </button>
        </div>
      )}
      {regles && regles.length === 0 && (
        <p className="mt-2 text-xs italic text-ink/50">
          Corrections purement factuelles — aucune règle réutilisable détectée.
        </p>
      )}
      {reglesEnregistrees && <p className="mt-2 text-xs text-ok">✓ Règles ajoutées à la mémoire de la marque.</p>}
    </div>
  );
}
