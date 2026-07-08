"use client";

import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import type { Account } from "@/db/schema";
import { PLATFORMS, formatLabel } from "@/lib/constants";
import { createIdea, creerEtPlanifierIdee } from "@/app/actions/ideas";

type IdeeGeneree = {
  titre: string;
  format: string;
  accroche: string;
  structure: string[];
  cta: string;
  pilier: string;
};

/** Génération d'idées IA (CONCEPTION.md §4.1) — marque + thème → 3-5 idées structurées. */
export function IdeaGeneratorForm({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = useState<number>(accounts[0]?.id ?? 0);
  const [theme, setTheme] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idees, setIdees] = useState<IdeeGeneree[] | null>(null);
  const [retenues, setRetenues] = useState<Set<number>>(new Set());

  async function generer() {
    if (!theme.trim()) return;
    setLoading(true);
    setError(null);
    setIdees(null);
    try {
      const res = await fetch("/api/ia/idees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, theme, platform: platform || undefined }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setIdees(data.idees);
      setRetenues(new Set());
    } catch {
      setError("L'IA est indisponible pour l'instant. Réessaie dans quelques minutes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className="field-label">Marque *</span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
              className="field"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-1">
            <span className="field-label">Thème *</span>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="field"
              placeholder="branding, coulisses, offre de printemps…"
            />
          </label>
          <label>
            <span className="field-label">Plateforme visée</span>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="field">
              <option value="">—</option>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={generer}
          disabled={loading || !theme.trim()}
          className="btn btn-accent mt-4 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Génération…" : (<><Sparkles size={15} aria-hidden /> Générer des idées</>)}
        </button>
      </div>

      {error && <div className="card mt-4 border-danger p-4 text-danger">⚠ {error}</div>}

      {loading && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-40 animate-pulse bg-ink/5 p-4" />
          ))}
        </div>
      )}

      {idees && idees.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {idees.map((idee, i) => (
            <div key={i} className="card p-4">
              <div className="flex flex-wrap gap-1">
                <span className="tag">{formatLabel(idee.format)}</span>
                {idee.pilier && <span className="tag">{idee.pilier}</span>}
              </div>
              <p className="mt-2 font-display text-xl">{idee.titre}</p>
              <p className="mt-1 text-sm italic text-ink/70">{idee.accroche}</p>
              <ul className="mt-2 list-inside list-disc text-sm text-ink/60">
                {idee.structure.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink/50">CTA : {idee.cta}</p>
              <form
                action={createIdea}
                onSubmit={() => setRetenues(new Set(retenues).add(i))}
                className="mt-3"
              >
                <input type="hidden" name="accountId" value={accountId} />
                <input type="hidden" name="title" value={idee.titre} />
                <input type="hidden" name="format" value={idee.format} />
                <input type="hidden" name="platform" value={platform} />
                <input type="hidden" name="pillar" value={idee.pilier} />
                <input type="hidden" name="theme" value={theme} />
                <input type="hidden" name="content" value={`${idee.accroche}\n\n${idee.structure.join("\n")}\n\nCTA : ${idee.cta}`} />
                <input type="hidden" name="source" value="ia" />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={retenues.has(i)} className="btn text-xs disabled:cursor-not-allowed disabled:opacity-60">
                    {retenues.has(i) ? (<><Check size={13} aria-hidden /> Retenue</>) : "Retenir cette idée"}
                  </button>
                  <button
                    type="submit"
                    formAction={creerEtPlanifierIdee}
                    disabled={retenues.has(i)}
                    className="btn btn-accent text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Planifier tout de suite
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}

      {idees && idees.length === 0 && (
        <p className="mt-4 text-ink/50 italic">Aucune idée renvoyée — essaie un thème plus précis.</p>
      )}
    </div>
  );
}
