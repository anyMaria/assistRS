"use client";

import { useId, useState } from "react";

type Message = { role: "assistant" | "user"; text: string };

const INTRO: Message = {
  role: "assistant",
  text:
    "Bonjour Ana. Bientôt, tu pourras me demander d'exécuter des actions dans l'app " +
    "(préparer une publication, lancer une recherche d'inspiration…) directement depuis ce chat. " +
    "Cette connexion n'est pas encore active — pour l'instant je ne fais qu'afficher l'interface.",
};

/**
 * Façade du futur chatbot agent (voir CONCEPTION.md — étape à venir, non fonctionnelle).
 * Aucune requête n'est envoyée : l'échange reste local pour prévisualiser l'interface.
 */
export function ChatbotWidget() {
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [input, setInput] = useState("");
  const inputId = useId();

  function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "assistant",
        text: "🚧 Cette fonctionnalité arrive dans une prochaine étape — l'agent d'exécution n'est pas encore connecté.",
      },
    ]);
    setInput("");
  }

  return (
    <section className="card flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl">Assistant</h2>
        <span className="tag">Bientôt disponible</span>
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: 260 }}>
        {messages.map((m, i) => (
          <p
            key={i}
            className={`max-w-[85%] p-2 text-sm ${
              m.role === "assistant"
                ? "bg-ink/5"
                : "ml-auto bg-accent text-white"
            }`}
          >
            {m.text}
          </p>
        ))}
      </div>

      <form onSubmit={envoyer} className="mt-3 flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Message à l&apos;assistant
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="field"
          placeholder="Écris à l'assistant…"
        />
        <button type="submit" className="btn btn-accent shrink-0">
          Envoyer
        </button>
      </form>
    </section>
  );
}
