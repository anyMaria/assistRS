"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Mesure la largeur du conteneur avant de rendre le graphe (évite le rendu recharts à 0×0). */
export function ChartBox({ height, children }: { height: number; children: (width: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ height, width: "100%" }}>
      {width > 0 && children(width)}
    </div>
  );
}

/** Suit la classe .dark sur <html> pour adapter les couleurs recharts au mode sombre. */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function useChartColors() {
  const dark = useIsDark();
  return {
    dark,
    axisColor: dark ? "#9aa2b1" : "#0e1116",
    gridColor: dark ? "#ffffff14" : "#0e111611",
    tooltipStyle: {
      border: `1px solid ${dark ? "#262b36" : "#e6e8ef"}`,
      borderRadius: 12,
      background: dark ? "#14171e" : "#ffffff",
      color: dark ? "#eef1f6" : "#0e1116",
      fontSize: 13,
    },
  };
}
