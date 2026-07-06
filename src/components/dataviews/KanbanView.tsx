"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import type { DataCard, KanbanColumn } from "./types";

function Card({
  card,
  columns,
  onMove,
}: {
  card: DataCard;
  columns: KanbanColumn[];
  onMove: (id: number, column: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  });
  const index = columns.findIndex((c) => c.key === card.column);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="card cursor-grab touch-none p-3 active:cursor-grabbing"
      style={{
        borderLeftWidth: 6,
        borderLeftColor: card.color ?? "#1C1917",
        boxShadow: isDragging ? "3px 3px 0 #1C1917" : undefined,
        transform: isDragging ? "rotate(2deg)" : undefined,
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <p className="font-semibold">{card.title}</p>
      {card.subtitle && <p className="mt-0.5 text-xs text-ink/50">{card.subtitle}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
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
      {card.extra && (
        <p className="mt-1 text-xs" style={{ color: card.extraColor ?? "#78716c" }}>
          {card.extra}
        </p>
      )}
      {/* Déplacement au clavier, pour l'accessibilité (le drag souris ne suffit pas) */}
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          title="Colonne précédente"
          disabled={index <= 0}
          onClick={() => onMove(card.id, columns[index - 1].key)}
          className="btn px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-30"
        >
          ←
        </button>
        <button
          type="button"
          title="Colonne suivante"
          disabled={index === -1 || index >= columns.length - 1}
          onClick={() => onMove(card.id, columns[index + 1].key)}
          className="btn px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}

function Column({
  column,
  cards,
  onMove,
  columns,
}: {
  column: KanbanColumn;
  cards: DataCard[];
  columns: KanbanColumn[];
  onMove: (id: number, column: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-64 flex-1 border-2 border-ink p-3 transition ${isOver ? "bg-ink/5" : "bg-paper"}`}
    >
      <h3 className="field-label flex items-center justify-between">
        {column.label}
        <span className="text-ink/40">{cards.length}</span>
      </h3>
      <div className="mt-2 space-y-2">
        {cards.length === 0 && <p className="text-xs italic text-ink/40">Vide</p>}
        {cards.map((card) => (
          <Card key={card.id} card={card} columns={columns} onMove={onMove} />
        ))}
      </div>
    </div>
  );
}

/** Vue kanban : colonnes par statut, cartes draggables (souris + clavier). */
export function KanbanView({
  columns,
  cards,
  onMove,
}: {
  columns: KanbanColumn[];
  cards: DataCard[];
  onMove: (id: number, column: string) => Promise<void>;
}) {
  const [localCards, setLocalCards] = useState(cards);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Resynchronise si les données serveur changent (revalidation)
  if (cards !== localCards && cards.length !== localCards.length) {
    setLocalCards(cards);
  }

  function move(id: number, column: string) {
    setLocalCards((prev) => prev.map((c) => (c.id === id ? { ...c, column } : c)));
    void onMove(id, column);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const id = Number(active.id);
    const column = String(over.id);
    const card = localCards.find((c) => c.id === id);
    if (card && card.column !== column) move(id, column);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <Column
            key={col.key}
            column={col}
            columns={columns}
            cards={localCards.filter((c) => c.column === col.key)}
            onMove={move}
          />
        ))}
      </div>
    </DndContext>
  );
}
