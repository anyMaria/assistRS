"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/** Bascule clair/sombre, persistée dans localStorage (le <head> applique déjà la classe avant le rendu). */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Synchronise avec la classe posée par le script pré-hydratation dans <head> —
    // ne peut pas être lu pendant le rendu serveur (pas de `document`).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // stockage indisponible (navigation privée) — la préférence système reprendra la main
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="btn-icon"
    >
      {dark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
    </button>
  );
}
