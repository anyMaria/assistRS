import type { DataCard } from "./types";

/** Vue galerie : grille de vignettes des visuels finaux (aperçu de toutes les publications conçues). */
export function GalleryView({ cards }: { cards: DataCard[] }) {
  if (cards.length === 0) {
    return <p className="mt-6 text-ink/50 italic">Rien à afficher ici pour l&apos;instant.</p>;
  }
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <a
          key={card.id}
          href={card.visualUrl || undefined}
          target={card.visualUrl ? "_blank" : undefined}
          rel={card.visualUrl ? "noreferrer" : undefined}
          className="card block overflow-hidden transition hover:shadow-[3px_3px_0_#1C1917]"
          style={{ borderTopWidth: 4, borderTopColor: card.color ?? "#1C1917" }}
        >
          <div className="flex aspect-square items-center justify-center bg-paper">
            {card.visualUrl ? (
              // Aperçu externe : pas d'optimisation next/image nécessaire pour une simple vignette.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.visualUrl} alt={card.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl text-ink/20" aria-hidden>
                🖼
              </span>
            )}
          </div>
          <div className="p-2">
            <p className="truncate text-xs font-semibold">{card.title}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {card.badges.slice(0, 2).map((b, i) => (
                <span
                  key={i}
                  className="tag !px-1 !py-0 text-[9px]"
                  style={b.color ? { backgroundColor: b.color, color: "white", borderColor: "transparent" } : undefined}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
