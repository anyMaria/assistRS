"use client";

import { useState } from "react";

/** Marqueur cliquable « créneau conseillé » sur une case du calendrier (G10, overlay horaires). */
export function HourMarker({ label, color }: { label: string; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={label}
        aria-label={label}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] leading-none text-white"
        style={{ backgroundColor: color }}
      >
        ●
      </button>
      {open && (
        <span className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap border border-line bg-paper px-1.5 py-0.5 text-[10px] font-semibold">
          {label}
        </span>
      )}
    </span>
  );
}
