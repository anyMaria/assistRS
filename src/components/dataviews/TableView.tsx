import { CardModal, DetailFields } from "./CardModal";
import type { DataCard } from "./types";

/** Vue table : une ligne par élément, liseré de couleur conditionnelle. */
export function TableView({
  cards,
  columnLabel,
  planningLabel,
  planning,
  actions,
}: {
  cards: DataCard[];
  columnLabel: string;
  /** En-tête de la colonne dédiée à la planification (ex. « Ajout dans le planning »). */
  planningLabel?: string;
  planning?: (card: DataCard) => React.ReactNode;
  actions?: (card: DataCard) => React.ReactNode;
}) {
  if (cards.length === 0) {
    return <p className="mt-6 text-ink/50 italic">Rien à afficher ici pour l&apos;instant.</p>;
  }
  return (
    <div className="card mt-4 overflow-x-auto border-t-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th className="p-3">Titre</th>
            <th className="p-3">Étiquettes</th>
            <th className="p-3">{columnLabel}</th>
            {planning && <th className="border-l-2 border-ink bg-paper p-3">{planningLabel ?? "Planning"}</th>}
            {actions && <th className="p-3" />}
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr key={card.id} className="border-b border-ink/10 align-top">
              <td className="p-3" style={{ boxShadow: card.color ? `inset 4px 0 0 ${card.color}` : undefined }}>
                <CardModal
                  title={card.title}
                  trigger={
                    <>
                      <p className="font-semibold underline decoration-dotted underline-offset-2">{card.title}</p>
                      {card.subtitle && <p className="text-xs text-ink/50">{card.subtitle}</p>}
                    </>
                  }
                >
                  <div className="mb-4 flex flex-wrap gap-1">
                    {card.badges.map((b, i) => (
                      <span
                        key={i}
                        className="tag"
                        style={b.color ? { backgroundColor: b.color, color: "white", borderColor: "transparent" } : undefined}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                  <DetailFields fields={card.detail ?? []} />
                  {card.body && (
                    <div className="mt-4">
                      <p className="field-label">Structure</p>
                      <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-ink/70">{card.body}</pre>
                    </div>
                  )}
                </CardModal>
              </td>
              <td className="p-3">
                <span className="flex flex-wrap gap-1">
                  {card.badges.map((b, i) => (
                    <span
                      key={i}
                      className="tag"
                      style={b.color ? { backgroundColor: b.color, color: "white", borderColor: "transparent" } : undefined}
                    >
                      {b.label}
                    </span>
                  ))}
                </span>
              </td>
              <td className="p-3">
                <span
                  className="tag"
                  style={card.color ? { backgroundColor: card.color, color: "white", borderColor: "transparent" } : undefined}
                >
                  {card.columnLabel ?? card.column}
                </span>
              </td>
              {planning && <td className="border-l-2 border-ink bg-paper/60 p-3">{planning(card)}</td>}
              {actions && <td className="p-3">{actions(card)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
