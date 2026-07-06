# assistRS — Guideline d'exécution

> **À qui s'adresse ce document** : au modèle/développeur chargé d'implémenter la suite
> de l'application. Il est écrit pour être suivi **dans l'ordre, bloc par bloc, sans
> improvisation d'architecture**. La référence produit (le « pourquoi ») est dans
> `docs/CONCEPTION.md` — lis-la en entier avant de commencer. Ce document est le
> « comment ».

---

## 0. Règles d'or (à relire avant chaque bloc)

1. **Un bloc à la fois, dans l'ordre G1 → G7.** Ne commence pas un bloc avant que le
   précédent passe ses critères d'acceptation.
2. **Ne casse jamais l'existant.** Les pages actuelles (connexion, accueil, comptes,
   statistiques, programmation) fonctionnent : re-teste-les après chaque bloc.
3. **Interface 100 % en français.** Textes, labels, messages d'erreur, e-mails. Le code
   (variables, fonctions) reste en anglais.
4. **Aucun secret côté client.** Toute clé API (`GEMINI_API_KEY`, `APIFY_TOKEN`,
   `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`) n'est lue que dans du code serveur
   (server actions, route handlers). Jamais de `NEXT_PUBLIC_` pour un secret.
5. **Échec propre obligatoire.** Chaque appel externe (Gemini, Apify, Resend, Blob) est
   dans un `try/catch` ; en cas d'échec : message français clair à l'écran, le reste de
   la page fonctionne, et l'erreur est loguée avec `console.error`.
6. **Pas de nouvelle dépendance** hors liste autorisée (§2.6) sans justification écrite
   dans le message de commit.
7. **Vocabulaire du glossaire** (`CONCEPTION.md` §14) partout : une « marque », pas un
   « client » ; un « relevé », pas un « snapshot » dans l'UI.
8. **Vérifie avant de committer** : `npx tsc --noEmit` puis `npm run build` doivent
   passer, plus un test manuel dans le navigateur du parcours modifié.
9. **Un commit par fonctionnalité terminée**, message en français, descriptif.
   Ne pousse pas (`git push`) sans demande explicite d'Ana.
10. **En cas de doute sur Next.js** : ce projet utilise **Next 16** dont les conventions
    diffèrent de tes connaissances — la documentation officielle est dans
    `node_modules/next/dist/docs/`. Consulte-la au lieu de deviner.

---

## 1. État du code existant (carte)

```
assistRS/
├─ docs/CONCEPTION.md          ← référence produit (à lire en premier)
├─ drizzle.config.ts           ← dialect turso, url via DATABASE_URL (défaut file:local.db)
├─ .env.local                  ← APP_PASSWORD=trinkets, SESSION_SECRET, DATABASE_URL
├─ src/
│  ├─ proxy.ts                 ← auth globale (Next 16 : proxy, PAS middleware)
│  ├─ db/
│  │  ├─ schema.ts             ← toutes les tables Drizzle + types exportés
│  │  ├─ index.ts              ← client db (libSQL) — importer { db, ...tables } d'ici
│  │  └─ seed.ts               ← npm run db:seed (modèles + créneaux Buffer + vues/couleurs)
│  ├─ lib/
│  │  ├─ session.ts            ← cookie HMAC (Web Crypto, compatible Edge)
│  │  ├─ constants.ts          ← plateformes, formats, statuts, libellés FR, formatDate
│  │  ├─ kpi.ts                ← taux d'engagement, agrégats, latestSnapshots
│  │  ├─ deadline.ts           ← computeVisualDeadline, deadlineStatus, deadlineMessage
│  │  ├─ color-rules.ts        ← moteur de couleurs conditionnelles (evaluateColor)
│  │  └─ schedule/provider.ts  ← abstraction horaires (interface ScheduleProvider)
│  ├─ app/
│  │  ├─ connexion/page.tsx    ← login mot de passe (server action inline)
│  │  ├─ (app)/                ← layout avec Nav (sidebar desktop + barre bas mobile)
│  │  │  ├─ page.tsx           ← accueil (deadlines + KPI par marque)
│  │  │  ├─ comptes/page.tsx   ← CRUD marques (sera refondu en G1)
│  │  │  ├─ statistiques/page.tsx ← publications + relevés + KPI
│  │  │  └─ programmation/page.tsx ← grille horaires cliquable
│  │  └─ actions/              ← server actions ("use server") : accounts, publications,
│  │                              timeslots, ideas, settings
│  └─ components/
│     ├─ Nav.tsx               ← navigation (client)
│     ├─ AccountForm.tsx, PublicationForm.tsx, SnapshotForm.tsx
│     └─ dataviews/            ← WIP : types.ts, ViewTabs.tsx, TableView.tsx
│                                 (KanbanView et CalendarView restent à faire)
```

Base : `npm run db:push` (applique le schéma), `npm run db:seed`, `npm run dev`.

---

## 2. Conventions techniques obligatoires

### 2.1 Next.js 16 — les pièges qui te feront échouer si tu les ignores
- Le middleware s'appelle **`src/proxy.ts`** et exporte `export async function proxy()`.
  Ne crée JAMAIS de `middleware.ts`.
- `params` et `searchParams` des pages sont des **Promises** :
  `const { vue } = await searchParams;`
- Composants **serveur par défaut**. `"use client"` uniquement si le composant utilise
  état, événements ou @dnd-kit. On PEUT passer une server action en prop à un composant
  client.
- Toute mutation = server action dans `src/app/actions/*.ts` avec `"use server"` en tête
  de fichier, suivie de `revalidatePath()` sur chaque page affectée.
- Pour lier des arguments : `const action = maAction.bind(null, id);` puis
  `<form action={action}>`.
- Pages qui lisent la base : ajouter `export const dynamic = "force-dynamic";`.

### 2.2 Drizzle / SQLite
- Schéma : uniquement dans `src/db/schema.ts`. Après toute modification :
  `npm run db:push` (pas de fichiers de migration).
- Colonnes JSON = colonnes `text` : toujours `JSON.stringify` à l'écriture,
  `JSON.parse` à la lecture. Type les résultats après parse.
- Dates : `integer("...", { mode: "timestamp" })` — lit/écrit des objets `Date`.
- Requêtes : `db.select().from(table).where(eq(...))` ; imports depuis `"drizzle-orm"`.

### 2.3 Charte UX/UI (obligatoire — l'esthétique et l'interactivité font partie du produit)

Ana est graphiste : une interface fonctionnelle mais négligée est un échec. Chaque écran
doit passer les règles ci-dessous. En cas de doute esthétique, consulte les skills
`frontend-design` et `web-design-guidelines` avant d'inventer.

**a) Palette — le rouge signature `#DE2F2C`**
- Le thème est dans `src/app/globals.css` (`@theme`) : `bg-paper` (#F6F2EA), `text-ink`
  (#1C1917), `bg-accent` (**#DE2F2C**, survol `--color-accent-dark` #B22421),
  `text-danger` (#7A1512), `text-warn` (#D97706), `text-ok` (#3D7C47), plus
  `instagram/facebook/linkedin` pour les tags de plateforme.
- Le rouge accent est réservé aux **actions** : bouton principal (un seul par écran),
  liens d'action, élément actif, focus. Jamais de paragraphe entier en rouge ; sur fond
  papier, le rouge ne porte que des libellés courts et gras (contraste limite).
- `danger` ≠ `accent` : une alerte affiche TOUJOURS icône (⚠) + mot explicite, jamais la
  couleur seule. La couleur ne porte jamais l'information à elle seule (daltonisme).

**b) Typographie et hiérarchie**
- Pattern d'en-tête de page (déjà en place, à reproduire à l'identique) : `<h1>` en
  `font-display text-4xl italic` + sous-titre `text-ink/60` d'une phrase. Un seul h1
  par page ; sections en `font-display text-2xl`.
- Corps en Work Sans, jamais < 14 px (16 px pour les champs). Étiquettes de champs :
  `.field-label` (uppercase, petites capitales espacées).

**c) Composants — réutilise, n'invente pas**
- `.field`, `.field-label`, `.btn`, `.btn-accent`, `.tag`, `.card` couvrent 90 % des
  besoins. Style « atelier » : bordures franches 2 px encre, angles droits, pas
  d'ombres floues ni de dégradés. Les ombres sont **dures** (décalage 2-3 px, encre),
  utilisées au survol des cartes interactives.
- Pastilles de couleur de marque : carrées (pas rondes), bord encre 1 px.

**d) Interactivité — chaque action doit répondre**
- Tout élément cliquable : `cursor-pointer`, état de survol visible (boutons : fond
  encre/texte papier ; liens : soulignement), transition 150 ms (jamais > 300 ms).
  Le focus clavier est déjà géré globalement (`:focus-visible` outline accent) — ne le
  supprime jamais.
- Formulaires : le bouton de soumission passe en état de chargement
  (`useFormStatus` → libellé « Enregistrement… » + `disabled`). Après succès, feedback
  « ✓ Enregistré » qui s'efface après ~3 s — écris UN composant client partagé
  (`SubmitButton`) en G1 et réutilise-le partout.
- Suppressions : jamais en un clic — demander confirmation (bouton « Supprimer ? »
  qui exige un second clic, ou dialogue). Libellé explicite sur ce qui sera perdu.
- Kanban : pendant le drag, la carte prend une ombre dure + légère rotation (2°), la
  colonne cible se surligne (`bg-ink/5`) ; le drop est possible au clavier via des
  boutons ← → sur chaque carte (accessibilité).
- Checklist de production : cocher anime la case (scale bref) et fait apparaître la date.
- Barre de budget (S'inspirer) : remplissage animé, couleur ok → warn → danger selon le
  niveau.
- Chargements : `loading.tsx` avec skeletons (blocs papier pulsants) pour les grilles
  lentes (inspiration, analyse) ; jamais d'écran blanc.
- Erreurs : encart dans la page (`.card` avec bord danger + icône), jamais `alert()`.
- États vides : chaque liste vide affiche une phrase chaleureuse en français + LE bouton
  d'action qui permet de démarrer (jamais une zone vide muette).

**e) Mobile (usage quotidien réel : saisie depuis l'iPhone)**
- Cibles tactiles ≥ 44 px, formulaires en 1 colonne, champs numériques avec
  `inputMode="numeric"`, la nav est la barre en bas d'écran (max 5 entrées — si tu
  ajoutes une page, décide ce qui sort).
- Priorité mobile absolue pour : saisie de relevés, checklists, /bilan.

**f) Accessibilité (vérifiée avec le skill `web-design-guidelines` à chaque bloc)**
- Chaque input a un `<label>` ; chaque image un `alt` ; les dialogues (⌘K, confirmations)
  ont `role="dialog"`, se ferment par Échap et rendent le focus.
- `prefers-reduced-motion` est déjà respecté globalement — n'ajoute pas d'animation qui
  le contourne.
- Apostrophes françaises dans le JSX : `&apos;` (sinon ESLint `react/no-unescaped-entities`).

### 2.4 Gestion d'erreurs — patron unique
```ts
export async function actionAvecApiExterne(...): Promise<{ ok: true; data: X } | { ok: false; error: string }> {
  try {
    const data = await appelExterne();
    return { ok: true, data };
  } catch (e) {
    console.error("[apify] recherche échouée", e);
    return { ok: false, error: "La recherche d'inspiration est indisponible. Réessaie dans quelques minutes." };
  }
}
```
Le composant affiche `error` dans un encart `border-danger text-danger`. La page reste
utilisable.

### 2.5 Suivi des coûts — obligatoire pour Apify, Gemini et Resend
Chaque appel externe insère une ligne dans `api_usage` (service, action, costCents).
Helper à créer en G3 : `src/lib/api-usage.ts` avec `logUsage(service, action, costCents)`
et `monthlySpendCents(service)`.

### 2.6 Dépendances autorisées
Déjà installées : `drizzle-orm`, `@libsql/client`, `zod`, `papaparse`,
`@dnd-kit/core|sortable|utilities`.
À installer au moment voulu : `@vercel/blob` (G1), `@google/genai` (G2), `resend` (G6),
`@react-pdf/renderer` (G5). **Rien d'autre.** (Pas de lib iCal : on génère le texte
.ics à la main, voir §9.)

### 2.7 Dates et fuseau
Tout est stocké en `Date` (UTC en base). Affichage : helpers de `constants.ts`
(`formatDate`, `formatDateTime`, locale fr-FR). Les crons Vercel sont en UTC :
8 h Paris = 6 h UTC l'été, 7 h UTC l'hiver → planifier à `0 6 * * *` et accepter l'heure
d'écart saisonnier.

---

## 3. Boucle de travail

Pour chaque fonctionnalité : (1) relire la section correspondante de CONCEPTION.md →
(2) schéma DB si besoin + `npm run db:push` → (3) server actions → (4) UI → (5)
`npx tsc --noEmit` + `npm run build` → (6) test manuel navigateur (`npm run dev`,
mot de passe `trinkets`) → (7) re-test rapide des pages existantes → (8) commit.

---

## 4. Blocs d'exécution

### G1 — Vues Notion + Espaces de marque

**G1.a — Terminer les vues** (composants dans `src/components/dataviews/`)
- `KanbanView.tsx` (`"use client"`) : colonnes par statut, cartes draggables avec
  @dnd-kit (`DndContext`, `useDroppable` par colonne, `useDraggable` par carte).
  Props : `columns: KanbanColumn[]`, `cards: DataCard[]`,
  `onMove: (id: number, column: string) => Promise<void>` (server action passée en prop).
  Au drop : appeler `onMove` — la revalidation serveur rafraîchit.
- `CalendarView.tsx` (serveur) : grille mensuelle lundi→dimanche, navigation
  `?mois=YYYY-MM`. Une carte = pastille couleur marque + titre tronqué. Les publications
  planifiées affichent AUSSI une pastille ◆ sur le jour de leur deadline visuel
  (couleur selon `deadlineStatus`).
- Pages `/idees` et `/planning` : `ViewTabs` en haut (vues de `view_configs` filtrées
  par entité, `?vue=<id>`, défaut = première), rendu Table/Kanban/Calendrier selon
  `type`. Couleur conditionnelle par ligne/carte via `evaluateColor(rules, entity, row)`
  — pour les publications, le champ `deadline` = `daysUntil(deadline)` et
  `engagementRate` = taux du dernier relevé × 100.
- Page `/parametres` : sections Vues (liste + création + suppression — actions déjà
  écrites dans `actions/settings.ts`), Couleurs conditionnelles (liste + formulaire :
  entité, champ depuis `RULE_FIELDS`, opérateur, valeur, couleur, libellé), Mappings CSV
  (liste + suppression), et la page Formats d'export (tableau statique de
  CONCEPTION.md §4.4).
- Boutons de création rapide sur /idees (« + Nouvelle idée » → formulaire) et /planning
  (réutiliser `PublicationForm`).
- Sur une idée : bouton **« Planifier cette idée »** → crée une publication liée
  (`ideaId`), passe l'idée à `en_production`. Quand une publication liée passe à
  `publiee`, passer l'idée liée à `publiee` (dans `setPublicationStatus`).

**G1.b — Espaces de marque** (CONCEPTION.md §3 — la liste des champs y est exhaustive)
- Schéma : `brand_profiles`, `brand_identity`, `brand_assets`, `brand_editorial`,
  `brand_memory_rules` (colonnes listées CONCEPTION.md §10). Relations 1-1 par
  `accountId` unique ; créer les lignes à la volée si absentes.
- Page `/comptes` devient `/marques` (mettre à jour Nav + redirection
  `next.config.ts` → `redirects()` de /comptes vers /marques).
- `/marques` : liste de cartes (couleur, nom, plateformes, délai validation).
  `/marques/[id]` : 4 onglets (`?onglet=contexte|identite|editorial|memoire`) —
  formulaires par onglet, un « Enregistrer » par onglet.
- Champs liste (personnes clés, concurrents, piliers, exemples de ton, do's/don'ts,
  CTA…) : composant client générique `ListEditor` (ajouter/supprimer des lignes,
  sérialisé en `<input type="hidden">` JSON avant submit) — écris-le une fois,
  réutilise-le partout.
- Upload d'assets : installer `@vercel/blob`. Route handler
  `POST /api/marques/[id]/assets` (FormData) →
  `put(\`marques/\${id}/\${filename}\`, file, { access: "private" })` → insérer
  `brand_assets`. En dev sans token Blob : afficher « Configure BLOB_READ_WRITE_TOKEN »
  et désactiver l'upload (échec propre).
- Onglet Mémoire : liste des règles (texte, origine, date, interrupteur actif/inactif,
  suppression) + ajout manuel.

**Critères d'acceptation G1**
- [ ] Le composant partagé `SubmitButton` (état de chargement + « ✓ Enregistré ») existe
      et remplace les boutons de soumission des formulaires existants.
- [ ] /idees et /planning : 3 types de vues fonctionnent, changement de vue conservé
      dans l'URL, kanban drag & drop change le statut en base.
- [ ] Couleurs conditionnelles visibles et modifiables depuis /parametres.
- [ ] « Planifier cette idée » crée la publication liée et synchronise les statuts.
- [ ] /marques/[id] : les 4 onglets enregistrent et relisent tous leurs champs.
- [ ] Upload d'un logo fonctionne (ou se désactive proprement sans token).
- [ ] Le calendrier montre publications ET deadlines visuel.
- [ ] Build + tsc OK, pages Phase 1 intactes.

### G2 — Créer : IA de rédaction, mémoire, recall, déclinaisons

- `src/lib/gemini.ts` : client Gemini unique (voir §5 pour le client exact et les
  prompts exacts).
- `src/lib/brand-context.ts` : `buildBrandContext(accountId)` → texte compact (< 600
  mots) assemblant contexte, ligne éditoriale et règles de mémoire actives de la marque.
  Écris-le UNE fois, utilisé par toutes les features IA.
- Génération d'idées (`/creation`) : marque + thème → 3-5 idées structurées (sortie
  JSON, §5.2) → cartes avec « Retenir » (insère dans `ideas`, source `ia`).
- Rédaction de légende : depuis une publication ou une idée, bouton « Rédiger la
  légende » → route `POST /api/ia/legende` → textarea éditable pré-remplie +
  2 boutons : **Appliquer** (enregistre `editedOutput` dans `generations` + copie la
  légende dans le brief de la publication) et **Mémoriser mes corrections** (§5.4 :
  envoie généré + corrigé à l'IA, reçoit 1-3 règles, les affiche cochables, insère les
  cochées dans `brand_memory_rules`).
- Bouton « Améliorer mon texte » (explicite, jamais automatique) : même éditeur, prompt
  §5.5.
- Recall (`src/lib/recall.ts`, AUCUN appel IA) : à l'ouverture du formulaire de
  publication/idée avec un thème, chercher les publications de la marque dont le titre
  ou le pilier partage ≥ 1 mot significatif (> 3 lettres, hors mots vides) avec le
  thème, dont l'engagement du dernier relevé > médiane de la marque → encart « Ça avait
  bien marché » (titre, date, taux, lien, format).
- Déclinaison : bouton « Décliner vers… » (choix plateforme) → duplique la publication
  (nouvelle plateforme, statut planifiée, sans date) + affiche le rappel de format
  (tableau §4.4 de CONCEPTION.md, constante partagée `src/lib/formats.ts`).
- Table `generations` (schéma §10) alimentée à chaque appel IA.

**Critères d'acceptation G2**
- [ ] Sans `GEMINI_API_KEY` : les boutons IA affichent l'erreur propre, tout le
      reste fonctionne.
- [ ] Une légende générée, éditée puis « Appliquer » se retrouve sur la publication.
- [ ] « Mémoriser » crée des règles visibles dans l'onglet Mémoire, et une nouvelle
      génération les respecte (vérifier qu'elles sont dans le prompt).
- [ ] Le recall sort une ancienne publication pertinente sans appel réseau.
- [ ] La déclinaison crée la copie et montre le bon format d'export.

### G3 — S'inspirer : Apify, cache, budget, moodboards

- Schéma : `inspiration_searches`, `inspiration_items`, `moodboards`, `api_usage`.
- `src/lib/apify.ts` : voir §6 (helper unique + constantes de coûts + cache + budget).
- Page `/s-inspirer` : champ thème + marque optionnelle + cases sources (Pinterest
  pré-cochée, coût estimé affiché à côté de chaque source) + filtres (période, tri).
  Résultats en grille masonry : image, auteur, signaux (« épinglé 1,2 k fois »,
  « diffusée depuis 45 j »), lien original, bouton « Épingler ».
- Barre de budget en haut : `monthlySpendCents("apify")` / 500 ¢ ; au-delà de 450 ¢ :
  bandeau d'alerte + confirmation avant tout nouveau run.
- Cache : avant tout appel Apify, chercher une `inspiration_searches` de même
  `hash(thème normalisé + source + filtres)` datant de < 14 jours → resservir ses items
  avec la mention « résultats du JJ/MM (cache gratuit) » et un bouton « Relancer ».
- Épingler : télécharger l'image côté serveur → Blob privé (`blobThumbUrl`) → associer
  à un moodboard (existant ou créé à la volée, rattaché à une marque OU libre/thème).
  Page `/s-inspirer/moodboards` : grilles par moodboard.
- LinkedIn : n'utiliser que la recherche de posts (`harvestapi/linkedin-post-search`) ;
  ne JAMAIS implémenter de scraping de profils.

**Critères d'acceptation G3**
- [ ] Une recherche Pinterest 30 résultats fonctionne, loguée dans `api_usage` avec
      coût estimé, visible dans la barre de budget.
- [ ] La même recherche relancée < 14 j ne déclenche AUCUN appel Apify.
- [ ] Sans `APIFY_TOKEN` : message propre, page utilisable.
- [ ] Épingler copie l'image en Blob et l'affiche dans le moodboard.
- [ ] Le blocage doux à 4,50 $ se déclenche (testable en insérant des lignes api_usage).

### G4 — Planifier+ : checklists, récurrences, duplication, iCal

- `production_steps` : 5 étapes créées avec chaque publication (backfill des
  publications existantes au premier `db:push` via petit script `src/db/backfill.ts`).
  UI : mini-checklist dans le détail d'une publication (cases + dates auto). Cocher
  « envoyé au client » arme le suivi de relance : publication listée « À relancer » si
  pas de « validé » après `validationDelayDays`.
- `recurrences` : CRUD dans /planning (« ⟳ Récurrences ») ; à chaque chargement de
  /planning (et dans le cron quotidien), générer les occurrences manquantes jusqu'à
  J+35 (`lastGeneratedUntil` évite les doublons). Publications créées avec statut
  planifiée + heure du créneau.
- Duplication : bouton sur toute publication/idée (copie sans dates, titre « (copie) »).
- iCal : `GET /api/ical/[token]` → texte `text/calendar` généré à la main (§9). Un
  VEVENT par deadline visuel (« 🎨 Visuel à créer : … ») + un par date de publication.
  Page /parametres : générer/révoquer le token, afficher l'URL d'abonnement.
- « À relancer » et « À relever » (J+2/J+7, logique dans `src/lib/attention.ts`)
  s'ajoutent à l'accueil (3 blocs, CONCEPTION.md §2.2) et seront réutilisés par le bilan.

**Critères d'acceptation G4**
- [ ] Checklist visible et cochable, relance armée par « envoyé au client ».
- [ ] Une récurrence hebdo génère les bonnes publications sur 5 semaines, sans doublons.
- [ ] Le flux iCal s'importe dans Google Calendar (tester le fichier .ics téléchargé).
- [ ] L'accueil montre les 3 blocs À produire / À relancer / À relever.

### G5 — Mesurer+ : objectifs, temps, rapports PDF, créneaux auto, import CSV

- `goals`, `time_entries` : CRUD simples (objectifs dans /marques/[id], temps via le
  bouton « + » global et depuis une publication). Progression des objectifs sur
  l'accueil et /analyse.
- Import CSV (`/statistiques` → « Importer un CSV ») : upload → `papaparse` côté
  serveur → aperçu 5 lignes → écran de mapping (colonne CSV → champ relevé, via
  `STAT_FIELDS`) → « Enregistrer ce mapping » (`csv_mappings`) → association des lignes
  aux publications (par URL exacte, sinon date+plateforme, sinon création à la volée
  avec titre du CSV) → insertion des relevés + rapport d'import (X importés, Y ignorés).
- Croisement horaires : dans /analyse, tableau « tes heures réelles vs recommandées »
  (agrégat des relevés par jour/heure de publication). Si ≥ 10 publications avec stats
  sur une plateforme : encart « Mettre à jour ta grille ? » → aperçu des changements →
  appliquer = upsert `time_slots` source `personnalise`.
- Rapport PDF : installer `@react-pdf/renderer`. `GET /api/rapports/[accountId]/[mois]`
  → document : page de garde (nom marque, mois, sa couleur), KPI vs mois précédent,
  top 3 publications, objectifs, temps passé (valorisé si taux horaire), pied de page
  « Généré avec Assist RS ». Stocker dans Blob + lister dans /mesurer. Section
  « Recommandations » : bouton IA optionnel (prompt §5.6).

**Critères d'acceptation G5**
- [ ] Import d'un CSV Buffer-type (fabrique un fichier de test) crée les bons relevés
      et le mapping est réutilisable.
- [ ] Un PDF se génère avec des vraies données et se télécharge.
- [ ] La proposition de créneaux n'apparaît qu'à partir de 10 publications avec stats.
- [ ] Saisie de temps en < 10 secondes depuis mobile (bouton +).

### G6 — Rituels : bilan hebdo, rituel mensuel, e-mails

- Installer `resend`. `src/lib/email.ts` : expéditeur `onboarding@resend.dev`,
  destinataire `anymaridim@gmail.com` (constantes), gabarit HTML simple aux couleurs de
  l'app.
- **Un seul cron Vercel** (limite du plan Hobby : fréquence quotidienne) :
  `vercel.json` → `{ "crons": [{ "path": "/api/cron/quotidien", "schedule": "0 6 * * *" }] }`.
  La route (protégée par `CRON_SECRET` en header Authorization, à vérifier) décide
  selon la date : lundi → envoyer le bilan hebdo ; 1er du mois → e-mail d'invitation au
  rituel ; tous les jours → générer les occurrences de récurrences. Journaliser dans
  `api_usage` (service resend, coût 0).
- Bilan : même contenu que la page `/bilan` (deadlines de la semaine, à relancer, à
  relever, stats marquantes de la semaine passée = meilleures évolutions d'engagement).
  La page /bilan est le rendu web permanent (remplace l'entrée « Analyse » mobile si
  la barre dépasse 5 entrées).
- Rituel mensuel (`/rituel`) : bandeau sur l'accueil du 1er au 7. Wizard par marque :
  questions pré-remplies (saisonnalité §3.1) → réponses stockées dans
  `monthly_rituals.answers` → appel Gemini (§5.3) → propositions affichées ligne par
  ligne (thème, format, plateforme, date/créneau suggéré, accroche) avec
  garder/éditer/retirer → « Valider » = création des publications planifiées.

**Critères d'acceptation G6**
- [ ] `GET /api/cron/quotidien` avec le bon secret un lundi (simulable en forçant la
      date en query `?simuler=lundi`) envoie l'e-mail et retourne 200 ; sans secret → 401.
- [ ] Le rituel produit des publications planifiées correctes avec deadlines calculées.
- [ ] Sans `RESEND_API_KEY` : le cron logue et continue sans planter.

### G7 — Finitions : recherche, capture rapide, polish, déploiement

- Recherche ⌘K : composant client global (dialog), route `GET /api/recherche?q=` →
  LIKE sur marques, idées, publications, moodboards, modèles ; résultats groupés par
  type, navigation clavier.
- Bouton « + » global (coin bas droit desktop / dans la barre mobile) : menu 4 actions
  (idée, publication, relevé, temps).
- Page 404 personnalisée, états vides soignés partout, revue accessibilité avec le
  skill `web-design-guidelines`.
- README.md : installation locale, variables d'env, déploiement pas à pas
  Vercel + Turso + Blob + Resend + Apify (avec captures des étapes de création des
  comptes/tokens).
- PWA : `manifest.json` + icônes + meta iOS (`apple-mobile-web-app-capable`) —
  installable sur iPhone. (Web push : reporté, non bloquant.)
- Vérification finale complète avec le skill `webapp-testing` (Playwright) : parcours
  connexion → marque → idée → publication → relevé → bilan.

---

## 5. Spécifications IA (prompts exacts)

> **Décision d'Ana (06/07/2026) : l'IA de l'app est Google Gemini, palier gratuit**
> (~1 500 requêtes/jour avec Flash — jamais atteint à son usage, coût 0 €).
> Clé créée sur aistudio.google.com, stockée dans `GEMINI_API_KEY`.

Client unique dans `src/lib/gemini.ts` — SDK officiel `@google/genai` (à installer en
G2 ; **pas** l'ancien paquet déprécié `@google/generative-ai`) :
```ts
import { GoogleGenAI } from "@google/genai";
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
// Vérifie sur ai.google.dev le nom du modèle Flash stable au moment de coder,
// et laisse-le configurable via GEMINI_MODEL.
```

Règles pour tous les appels :
- `systemInstruction` = préambule §5.1 + contexte de marque.
- Sorties structurées (idées, calendrier, règles) : `responseMimeType:
  "application/json"` + `responseSchema` (voir §5.2). Sorties texte (légende,
  amélioration, analyse) : réponse libre, lue via `response.text`.
- **Gestion du palier gratuit** : une erreur 429 = quota par minute atteint → message
  « L'IA gratuite est très sollicitée, réessaie dans une minute. » (pas de retry
  automatique en boucle). Logguer chaque appel dans `api_usage` (service `gemini`,
  costCents 0) pour suivre le volume.
- Chaque appel dans un try/catch (patron §2.4) — sans `GEMINI_API_KEY`, les boutons IA
  affichent l'erreur propre et le reste de l'app fonctionne.

### 5.1 Préambule système commun (à préfixer à tous les prompts)
```
Tu es l'assistant éditorial d'Ana, community manager freelance. Tu écris en français.

Règles d'écriture strictes (anti-slop) :
- Interdits : "N'hésitez pas", "Plongez dans", "Découvrez sans plus attendre",
  "Que vous soyez… ou…", "Alors, prêt à… ?", les questions rhétoriques creuses,
  plus d'un point d'exclamation par texte, les émojis en série (max 2 par texte,
  0 si la politique de la marque l'exige), le jargon marketing vide.
- Exigences : concret et spécifique à la marque (utilise ses vrais produits, lieux,
  personnes), phrases courtes, une seule idée par phrase, accroche qui donne une
  information ou une émotion réelle, CTA simple et unique.
- Respecte scrupuleusement le CONTEXTE DE MARQUE fourni, en particulier le ton,
  les do's/don'ts et les RÈGLES MÉMORISÉES (elles priment sur tout le reste).
```

### 5.2 Génération d'idées — sortie JSON structurée
User message : contexte de marque (via `buildBrandContext`) + `Thème : <saisie>` +
`Plateforme visée : <choix>`. Utiliser une sortie structurée :
```ts
import { Type } from "@google/genai";

const response = await ai.models.generateContent({
  model: MODEL,
  contents: userMessage,
  config: {
    systemInstruction: PREAMBULE + "\n\n" + brandContext,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      required: ["idees"],
      properties: {
        idees: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["titre", "format", "accroche", "structure", "cta", "pilier"],
            properties: {
              titre: { type: Type.STRING },
              format: { type: Type.STRING, enum: ["carrousel", "reel", "story", "post"] },
              accroche: { type: Type.STRING },
              structure: { type: Type.ARRAY, items: { type: Type.STRING } },
              cta: { type: Type.STRING },
              pilier: { type: Type.STRING },
            },
          },
        },
      },
    },
  },
});
const data = JSON.parse(response.text ?? "{}"); // toujours dans un try/catch
```
Le même patron (schéma adapté) sert pour le calendrier mensuel (§5.3) et l'extraction
de règles (§5.4).

### 5.3 Calendrier éditorial mensuel
Entrée : contexte de marque + réponses du wizard + piliers avec leurs parts + grille de
créneaux forts de la marque + nombre de publications souhaité. Sortie JSON : liste de
`{ date, plateforme, format, pilier, titre, accroche }`. Consigne : répartir selon les
parts des piliers, placer sur les créneaux force 3 d'abord, ne jamais dépasser 1
publication/jour/plateforme.

### 5.4 Extraction de règles depuis les corrections
```
Voici un texte que tu as généré et la version corrigée par Ana.
Déduis 1 à 3 règles d'écriture COURTES et RÉUTILISABLES (pas spécifiques à ce texte)
qui expliquent ses corrections. Réponds en JSON : {"regles": ["...", "..."]}.
Si les corrections sont purement factuelles (dates, noms), réponds {"regles": []}.
```

### 5.5 Améliorer mon texte
Préambule commun + « Améliore le texte suivant sans le dénaturer : garde les idées,
le vocabulaire de la marque et la longueur (±20 %). Corrige orthographe et rythme.
Rends UNIQUEMENT le texte amélioré, sans commentaire. »

### 5.6 Analyse de stats / recommandations de rapport
Entrée : KPI agrégés du mois, top/flop publications (titre, format, créneau, taux),
objectifs. Sortie : 3 paragraphes courts — ce qui a marché, hypothèses d'explication,
3 recommandations concrètes pour le mois suivant. Interdit d'inventer des chiffres.

---

## 6. Intégration Apify (G3)

Un seul helper. Endpoint synchrone (attend la fin du run et rend les items) :

```ts
// src/lib/apify.ts
const APIFY_BASE = "https://api.apify.com/v2/acts";

export const ACTORS = {
  pinterest: { id: "easyapi~pinterest-search-scraper", centsPer1000: 299 },
  instagram: { id: "apify~instagram-scraper",          centsPer1000: 270 },
  linkedin:  { id: "harvestapi~linkedin-post-search",  centsPer1000: 200 },
  facebook:  { id: "apify~facebook-posts-scraper",     centsPer1000: 800 }, // coût réel constaté
  metaAds:   { id: "whoareyouanas~meta-ad-scraper",    centsPer1000: 1000 },
} as const;

export async function runActor(source: keyof typeof ACTORS, input: object, maxItems: number) {
  const { id, centsPer1000 } = ACTORS[source];
  const url = `${APIFY_BASE}/${id}/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}&timeout=120&limit=${maxItems}`;
  const res = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Apify ${source} : HTTP ${res.status}`);
  const items = (await res.json()) as Record<string, unknown>[];
  await logUsage("apify", source, Math.ceil((items.length * centsPer1000) / 1000));
  return items;
}
```

Entrées indicatives par actor — **vérifie l'onglet « Input » de chaque actor sur
apify.com avant d'implémenter, les schémas changent** :
- Pinterest (**vérifié en réel le 06/07/2026**) :
  `{ query: "<mots-clés>", limit: 20, filter: "all" }` — attention : `limit` **minimum
  20** (le plafond de l'app devient donc : exactement 20-30). Sortie constatée :
  `{ id, name, coverURL, thumbnailURL, slashURL, pinCount, type, owner: { fullName,
  username, followers, avatarURL } }`. Les items peuvent être des **tableaux Pinterest**
  (`type: "board"`) et pas seulement des épingles — affiche les deux (un board est une
  mine d'inspiration), signaux = `pinCount` + `owner.followers`.
- Instagram : `{ search: theme, searchType: "hashtag", resultsType: "posts", resultsLimit: 30 }`
- LinkedIn : `{ searchQueries: [theme], maxItems: 30 }`
- Facebook : `{ searchQuery: theme, maxPosts: 30 }`
- Meta Ads : `{ searchTerms: theme, country: "FR", maxItems: 20 }`

**Deux enseignements des tests réels, à respecter absolument :**
1. **Les requêtes longues/accentuées peuvent rendre 0 résultat** (« identité visuelle
   artisan » → 0 ; « branding artisan » → 20). Avant l'appel : retirer les accents,
   limiter à 2-3 mots-clés. Si 0 résultat : afficher « Aucun résultat — essaie des
   mots-clés plus simples ou en anglais » (et ne PAS logguer de coût).
2. **Un run dure ~100 secondes.** L'endpoint `run-sync` dépasserait le timeout des
   fonctions Vercel (60 s sur le plan Hobby). Implémente donc en **asynchrone** :
   `POST /v2/acts/<actor>/runs` (démarre, rend `runId` + `defaultDatasetId`) → la page
   affiche l'état « Recherche en cours… » (skeleton) → un polling client toutes les 5 s
   sur une route `GET /api/inspiration/statut?runId=...` qui interroge
   `GET /v2/actor-runs/<runId>` → quand `status === "SUCCEEDED"`, récupérer
   `GET /v2/datasets/<datasetId>/items` et enregistrer. Remplace le helper `runActor`
   synchrone ci-dessus par cette paire start/poll.

Normalise chaque item vers `inspiration_items` (source, imageUrl, author, postedAt,
metrics JSON, originalUrl) — champ par champ selon la sortie réelle de l'actor (lance un
run de test et regarde le JSON).

Garde-fous (ordre d'exécution dans l'action serveur) : 1) cache < 14 j → servir sans
appel ; 2) budget mensuel ≥ 450 ¢ → exiger confirmation ; 3) plafonner maxItems à 30
(20 pour Meta Ads) ; 4) logUsage après chaque run réel.

---

## 7. Resend (G6)

```ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: "Assist RS <onboarding@resend.dev>",
  to: "anymaridim@gmail.com",
  subject: "Ton bilan de la semaine — Assist RS",
  html, // gabarit simple : fond #F6F2EA, encre #1C1917, listes d'actions avec liens vers l'app
});
```
Le cron est décrit en G6. `CRON_SECRET` : générer une chaîne aléatoire, la mettre dans
les env vars Vercel, la vérifier en `Authorization: Bearer` dans la route.

## 8. Vercel Blob (G1, G3, G5)

```ts
import { put } from "@vercel/blob";
const blob = await put(`marques/${id}/${file.name}`, file, { access: "private" });
// blob.url → stocker en base. Les URL privées se lisent via le SDK côté serveur ;
// pour l'affichage, passer par une route handler qui proxifie (vérifie la session).
```

## 9. iCal (G4) — génération à la main

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Assist RS//FR
BEGIN:VEVENT
UID:pub-<id>-deadline@assistrs
DTSTART;VALUE=DATE:20260715
SUMMARY:🎨 Visuel à créer : <titre> (<marque>)
END:VEVENT
END:VCALENDAR
```
Content-Type `text/calendar; charset=utf-8`. Échapper les virgules/points-virgules dans
SUMMARY (`\,` `\;`). Lignes ≤ 75 caractères (plier avec CRLF + espace).

## 10. PDF (G5)

`@react-pdf/renderer` : composant `<Document><Page>` avec `StyleSheet.create`.
Enregistrer les polices Fraunces/Work Sans via `Font.register` (fichiers .ttf dans
`src/assets/fonts/`, à télécharger depuis Google Fonts). Rendu serveur :
`renderToBuffer(<RapportPDF … />)` dans la route handler, puis upload Blob + réponse
`application/pdf`.

---

## 11. Pièges connus (déjà rencontrés sur ce projet)

1. `create-next-app` refuse les majuscules → le package s'appelle `assistrs`, ne pas
   « corriger ».
2. Next 16 = `proxy.ts`. Un fichier `middleware.ts` est ignoré silencieusement.
3. `searchParams` non-await → erreur runtime « searchParams should be awaited ».
4. Colonnes JSON : oublier `JSON.parse` → affichage « ["instagram"] » brut à l'écran.
5. ESLint bloque les apostrophes nues dans le JSX → `&apos;`.
6. `npm run db:push` après CHAQUE modification de schema.ts, sinon erreurs SQLite
   « no such column ».
7. Les images scrapées (Instagram surtout) ont des URL à durée de vie courte → toujours
   copier en Blob ce qu'on veut garder (moodboards).
8. Vercel Hobby : 1 seul cron quotidien fiable → tout passe par `/api/cron/quotidien`.
9. `git push` vers main est bloqué dans cet environnement : committer localement,
   demander à Ana pour pousser.
10. Ne jamais mettre `responseSchema` ET demander du texte libre dans le même appel
    Gemini — choisir : JSON structuré (idées, calendrier, règles) ou texte libre
    (légende, amélioration, analyse). Et toujours parser `response.text` dans un
    try/catch.
11. Le SDK Gemini est `@google/genai` — PAS `@google/generative-ai` (déprécié), que tes
    connaissances proposeront peut-être par défaut.

## 12. Définition de « terminé » (globale)

Le projet est terminé quand : les 7 blocs passent leurs critères, `npm run build` est
propre, le parcours complet fonctionne sur mobile 375 px, le README permet à Ana de
déployer seule sur Vercel + Turso, et une revue `web-design-guidelines` +
`code-simplifier`/`/simplify` a été passée sur l'ensemble.
