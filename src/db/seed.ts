/**
 * Seed : bibliothèque de modèles de contenu + créneaux horaires génériques
 * (études publiques Buffer) + vues et règles de couleurs par défaut.
 * Lancement : npm run db:seed  (idempotent : vide puis re-remplit les données seed)
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import {
  contentTemplates,
  timeSlots,
  viewConfigs,
  colorRules,
} from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client);

const IG = "instagram";
const FB = "facebook";
const LI = "linkedin";

const templates = [
  {
    title: "Carrousel avant / après",
    format: "carrousel",
    platforms: JSON.stringify([IG, FB, LI]),
    objective: "notoriete",
    hook: "« On est partis de ça… » (slide 1 : l'avant, brut)",
    structure:
      "Slide 1 : l'AVANT (photo brute, contexte en une phrase)\nSlide 2 : le problème / le brief du client\nSlides 3-4 : le processus (2-3 étapes clés, coulisses)\nSlide 5 : l'APRÈS (résultat final, mise en valeur)\nSlide 6 : récap avant/après côte à côte",
    cta: "« Un projet similaire en tête ? Écris-moi en MP »",
    origin: "bibliotheque",
  },
  {
    title: "Carrousel pédagogique en 5 slides",
    format: "carrousel",
    platforms: JSON.stringify([IG, LI]),
    objective: "engagement",
    hook: "« 5 choses que j'aurais aimé savoir avant de… »",
    structure:
      "Slide 1 : titre choc + promesse claire\nSlides 2-5 : un conseil par slide (titre court + 2 lignes max + visuel)\nSlide 6 : récap des 5 points\nSlide 7 : CTA",
    cta: "« Enregistre ce post pour plus tard 🔖 »",
    origin: "bibliotheque",
  },
  {
    title: "Carrousel checklist",
    format: "carrousel",
    platforms: JSON.stringify([IG, LI]),
    objective: "conversion",
    hook: "« La checklist que j'utilise pour chaque [livrable] »",
    structure:
      "Slide 1 : « La checklist [sujet] » + bénéfice\nSlides 2-6 : un point de contrôle par slide, avec case cochée\nSlide 7 : proposition d'accompagnement",
    cta: "« Besoin d'aide pour la mettre en place ? Contacte-moi »",
    origin: "bibliotheque",
  },
  {
    title: "Carrousel erreurs à éviter",
    format: "carrousel",
    platforms: JSON.stringify([IG, FB, LI]),
    objective: "engagement",
    hook: "« 4 erreurs qui ruinent [résultat] (la 3e est partout) »",
    structure:
      "Slide 1 : titre + tension\nSlides 2-5 : une erreur par slide → pourquoi c'est un problème → le bon réflexe\nSlide 6 : récap + ouverture",
    cta: "« Tu en fais combien ? Dis-le en commentaire »",
    origin: "bibliotheque",
  },
  {
    title: "Reel coulisses",
    format: "reel",
    platforms: JSON.stringify([IG, FB]),
    objective: "notoriete",
    hook: "Plan rapide de l'atelier / écran, texte : « Une journée dans les coulisses »",
    structure:
      "Séq. 1 (0-2 s) : hook visuel fort, mouvement\nSéq. 2 (2-10 s) : 3-4 plans courts du processus de création\nSéq. 3 (10-18 s) : le résultat qui se révèle\nSéq. 4 (18-25 s) : plan final + texte CTA\nMusique tendance, sous-titres incrustés",
    cta: "« Suis-moi pour plus de coulisses »",
    origin: "bibliotheque",
  },
  {
    title: "Reel tuto rapide",
    format: "reel",
    platforms: JSON.stringify([IG, FB]),
    objective: "engagement",
    hook: "« Comment faire [résultat] en 30 secondes »",
    structure:
      "Séq. 1 (0-2 s) : promesse à l'écran\nSéq. 2 : étapes en accéléré, une consigne par plan (texte incrusté)\nSéq. 3 : résultat final\nRythme rapide, une idée = un plan",
    cta: "« Enregistre pour tester plus tard »",
    origin: "bibliotheque",
  },
  {
    title: "Reel avant / après (process en accéléré)",
    format: "reel",
    platforms: JSON.stringify([IG]),
    objective: "notoriete",
    hook: "L'avant en plein écran 1 s, puis transition claquée",
    structure:
      "Séq. 1 : l'AVANT (1-2 s)\nSéq. 2 : timelapse du travail (5-10 s)\nSéq. 3 : l'APRÈS avec zoom sur les détails\nTransition synchronisée sur la musique",
    cta: "« Quel est ton préféré : avant ou après ? »",
    origin: "bibliotheque",
  },
  {
    title: "Reel tendance adaptée au métier",
    format: "reel",
    platforms: JSON.stringify([IG, FB]),
    objective: "notoriete",
    hook: "Reprendre un son / format tendance et le détourner sur ton secteur",
    structure:
      "Séq. 1 : le format tendance tel quel (repérable)\nSéq. 2 : le détournement métier (l'inattendu)\nCourt (moins de 15 s), sous-titré",
    cta: "« Tague quelqu'un que ça ferait rire »",
    origin: "bibliotheque",
  },
  {
    title: "Post FAQ",
    format: "post",
    platforms: JSON.stringify([IG, FB, LI]),
    objective: "conversion",
    hook: "« La question qu'on me pose à chaque projet : … »",
    structure:
      "Visuel : la question en gros + réponse courte\nLégende : réponse développée en 3 paragraphes courts, ton direct\nFinir par une invitation à poser d'autres questions",
    cta: "« Une autre question ? Pose-la en commentaire »",
    origin: "bibliotheque",
  },
  {
    title: "Post témoignage client",
    format: "post",
    platforms: JSON.stringify([FB, LI]),
    objective: "conversion",
    hook: "Citation client en gros caractères sur le visuel",
    structure:
      "Visuel : citation + nom/logo du client\nLégende : contexte du projet (2 lignes), le défi, le résultat chiffré si possible\nRemercier le client, taguer son compte",
    cta: "« Envie du même résultat ? Parlons-en »",
    origin: "bibliotheque",
  },
  {
    title: "Story sondage / quiz",
    format: "story",
    platforms: JSON.stringify([IG, FB]),
    objective: "engagement",
    hook: "Question directe + sticker sondage",
    structure:
      "Story 1 : question avec sticker sondage (2 choix)\nStory 2 : la réponse + explication courte\nStory 3 : ouverture (boîte à questions)\nRépondre en story aux participations le lendemain",
    cta: "Sticker « Pose ta question »",
    origin: "bibliotheque",
  },
  {
    title: "Post annonce / nouveauté",
    format: "post",
    platforms: JSON.stringify([IG, FB, LI]),
    objective: "notoriete",
    hook: "« Grande nouvelle 🎉 » ou teaser mystère la veille",
    structure:
      "Visuel : l'annonce, identité graphique forte\nLégende : la nouveauté, ce que ça change pour l'audience, à partir de quand\nÉpingler le post quelques jours",
    cta: "« Toutes les infos en bio / en commentaire »",
    origin: "bibliotheque",
  },
];

// Créneaux génériques d'après les études publiques Buffer.
// dayOfWeek : 0 = lundi … 6 = dimanche. strength : 1 faible, 2 bon, 3 fort.
type Slot = [platform: string, type: string, day: number, hour: number, strength: number];
const slots: Slot[] = [
  // Instagram — posts : cœur de semaine en fin de matinée
  [IG, "post", 0, 11, 2], [IG, "post", 1, 11, 3], [IG, "post", 2, 11, 3],
  [IG, "post", 3, 11, 3], [IG, "post", 4, 11, 2],
  [IG, "post", 1, 8, 2], [IG, "post", 2, 8, 2], [IG, "post", 3, 8, 2],
  [IG, "post", 0, 14, 1], [IG, "post", 4, 14, 1], [IG, "post", 6, 19, 1],
  // Instagram — reels : matin tôt, midi et soirée
  [IG, "reel", 0, 9, 2], [IG, "reel", 1, 9, 3], [IG, "reel", 2, 9, 3],
  [IG, "reel", 3, 12, 3], [IG, "reel", 4, 12, 2],
  [IG, "reel", 1, 19, 2], [IG, "reel", 3, 19, 2], [IG, "reel", 6, 20, 2],
  // Instagram — stories : midi et début de soirée
  [IG, "story", 0, 12, 2], [IG, "story", 1, 12, 3], [IG, "story", 2, 12, 3],
  [IG, "story", 3, 12, 2], [IG, "story", 4, 12, 2],
  [IG, "story", 1, 20, 2], [IG, "story", 2, 20, 3], [IG, "story", 3, 20, 2],
  [IG, "story", 6, 21, 1],
  // Facebook — posts : matinée en semaine
  [FB, "post", 0, 10, 2], [FB, "post", 1, 10, 3], [FB, "post", 2, 10, 3],
  [FB, "post", 3, 10, 2], [FB, "post", 4, 10, 2],
  [FB, "post", 0, 13, 2], [FB, "post", 2, 13, 2], [FB, "post", 4, 13, 1],
  // Facebook — reels : midi et soirée
  [FB, "reel", 1, 12, 2], [FB, "reel", 2, 12, 3], [FB, "reel", 3, 12, 2],
  [FB, "reel", 1, 19, 2], [FB, "reel", 3, 19, 2], [FB, "reel", 5, 11, 1],
  // Facebook — stories
  [FB, "story", 0, 12, 2], [FB, "story", 2, 12, 2], [FB, "story", 4, 12, 2],
  [FB, "story", 1, 19, 2], [FB, "story", 3, 19, 2],
  // LinkedIn — posts : mardi-jeudi en matinée (pas de reels/stories natifs)
  [LI, "post", 0, 9, 2], [LI, "post", 1, 9, 3], [LI, "post", 1, 10, 3],
  [LI, "post", 2, 9, 3], [LI, "post", 2, 12, 2],
  [LI, "post", 3, 9, 3], [LI, "post", 3, 10, 2], [LI, "post", 4, 9, 1],
];

const defaultViews = [
  { entity: "idees", name: "Table", type: "table", config: "{}" },
  {
    entity: "idees",
    name: "Kanban par statut",
    type: "kanban",
    config: JSON.stringify({ groupBy: "status" }),
  },
  { entity: "publications", name: "Calendrier", type: "calendrier", config: "{}" },
  { entity: "publications", name: "Table", type: "table", config: "{}" },
  {
    entity: "publications",
    name: "Kanban par statut",
    type: "kanban",
    config: JSON.stringify({ groupBy: "status" }),
  },
];

const defaultColorRules = [
  { entity: "idees", field: "status", operator: "egal", value: "idee", color: "#8A857B", label: "Idée" },
  { entity: "idees", field: "status", operator: "egal", value: "en_production", color: "#D9A404", label: "En production" },
  { entity: "idees", field: "status", operator: "egal", value: "publiee", color: "#3D7C47", label: "Publiée" },
  { entity: "publications", field: "deadline", operator: "inferieur", value: "0", color: "#7A1512", label: "Deadline dépassée" },
  { entity: "publications", field: "deadline", operator: "inferieur", value: "2", color: "#D97706", label: "Deadline proche (moins de 2 jours)" },
  { entity: "publications", field: "status", operator: "egal", value: "publiee", color: "#3D7C47", label: "Publiée" },
];

async function main() {
  // Idempotent : on ne ré-insère que les données « seed »
  await db.delete(contentTemplates).where(eq(contentTemplates.origin, "bibliotheque"));
  await db.insert(contentTemplates).values(templates);

  await db.delete(timeSlots).where(eq(timeSlots.source, "generique"));
  await db.insert(timeSlots).values(
    slots.map(([platform, contentType, dayOfWeek, hour, strength]) => ({
      platform,
      contentType,
      dayOfWeek,
      hour,
      strength,
      source: "generique",
    })),
  );

  const existingViews = await db.select().from(viewConfigs);
  if (existingViews.length === 0) {
    await db.insert(viewConfigs).values(defaultViews);
  }

  const existingRules = await db.select().from(colorRules);
  if (existingRules.length === 0) {
    await db.insert(colorRules).values(defaultColorRules);
  }

  console.log(
    `Seed OK : ${templates.length} modèles, ${slots.length} créneaux, vues et couleurs par défaut.`,
  );
}

main().then(() => process.exit(0));
