# Tâche DÉPLOIEMENT — Mettre assistRS en ligne (Vercel + Turso + toutes les clés)

> **Quand l'utiliser** : avant G8, dès maintenant. À donner à Claude Code comme les
> autres briefs. Particularité : plusieurs étapes se passent dans des interfaces web
> (Vercel, Turso, Buffer…) — l'IA fait tout ce qui est possible en CLI et **guide Ana
> pas à pas** pour le reste, en vérifiant chaque étape avant de passer à la suivante.

## Contexte (pourquoi c'est cassé)

Le code est sain : `npm run build` passe en local. Mais en production l'app n'a pas de
base de données — chaque page fait des requêtes Drizzle au rendu (`force-dynamic`), et
sans `DATABASE_URL` Turso valide, tout part en erreur 500. De plus, si `db:seed` n'a
jamais tourné contre la base de prod, aucune vue par défaut n'existe (pages Idées et
Planifier vides avec « Aucune vue configurée »). Objectif : un déploiement propre,
vérifié de bout en bout.

## Règles pour l'IA exécutrice

- Modèle recommandé : **Sonnet**.
- **Ne modifie aucun fichier de code** (seule exception autorisée : `.env.local`, et
  uniquement avec l'accord d'Ana). Ce bloc est de la configuration, pas du développement.
- **N'affiche jamais une clé/token en clair** dans tes réponses ; désigne-les par leur nom.
- Procède **étape par étape**, dans l'ordre, et vérifie chaque étape (commande de test)
  avant de passer à la suivante. Si une étape échoue, diagnostique avant de continuer.
- Les valeurs locales existent déjà dans `.env.local` (Gemini, Apify, Resend testées OK
  en juillet 2026) — il s'agit surtout de les **reporter dans Vercel**, pas d'en créer
  de nouvelles, sauf indication contraire ci-dessous.

## Étape 1 — Base de données Turso

1. Vérifier si la CLI est installée : `turso --version`. Sinon, la faire installer
   (Windows : `irm get.tur.so/install.ps1 | iex` dans PowerShell, ou WSL/scoop) puis
   `turso auth login` (ouvre le navigateur — Ana se connecte / crée un compte gratuit).
2. `turso db create assistrs` (région par défaut la plus proche : choisir Europe, ex. `fra`).
3. Récupérer les deux valeurs :
   - `turso db show assistrs --url` → ce sera `DATABASE_URL` (forme `libsql://…`).
   - `turso db tokens create assistrs` → ce sera `DATABASE_AUTH_TOKEN`.
4. **Créer le schéma et les données de base** depuis la machine d'Ana :
   lancer `npm run db:push` puis `npm run db:seed` avec ces deux variables pointées
   vers Turso **le temps de ces deux commandes** (en PowerShell :
   `$env:DATABASE_URL="libsql://…"; $env:DATABASE_AUTH_TOKEN="…"; npm run db:push; npm run db:seed`
   dans une session dédiée — ne pas toucher `.env.local` qui doit rester sur `file:local.db`).
5. Vérifier : `turso db shell assistrs "select count(*) from view_configs;"` doit
   renvoyer un nombre > 0 (les vues par défaut du seed).

## Étape 2 — Inventaire des clés

Toutes les variables attendues sont documentées dans `.env.example` et le tableau du
`README.md`. À reporter dans Vercel à l'étape 3 :

| Variable | Source | État attendu |
|---|---|---|
| `DATABASE_URL` | étape 1.3 | nouvelle (Turso) |
| `DATABASE_AUTH_TOKEN` | étape 1.3 | nouvelle (Turso) |
| `GEMINI_API_KEY` | déjà dans `.env.local` | copier telle quelle |
| `APIFY_TOKEN` | déjà dans `.env.local` | copier telle quelle |
| `RESEND_API_KEY` | déjà dans `.env.local` | copier telle quelle |
| `CRON_SECRET` | déjà dans `.env.local` ; sinon en générer une (32+ caractères aléatoires) | copier/générer |
| `BLOB_READ_WRITE_TOKEN` | créé à l'étape 4 (Vercel Blob) | ne pas inventer |
| `BUFFER_ACCESS_TOKEN` | `publish.buffer.com/settings/api` → Access Token | si Ana ne l'a pas encore : la guider ; sinon copier |

Rappels utiles : Resend sans domaine vérifié n'envoie qu'à l'adresse du compte
(comportement connu, pas un bug de déploiement). `GEMINI_MODEL` est optionnelle.

## Étape 3 — Projet Vercel

1. Faire ouvrir à Ana [vercel.com/dashboard](https://vercel.com/dashboard) : le projet
   assistRS existe-t-il déjà ?
   - **Non** → [vercel.com/new](https://vercel.com/new), importer le repo GitHub
     `anyMaria/assistRS` (framework Next.js auto-détecté, aucun réglage build à changer).
   - **Oui** → onglet **Deployments** : noter si le dernier déploiement est « Ready »
     et s'il correspond au dernier commit de `main` (comparer avec `git log --oneline -1`).
     Un déploiement ancien explique les 404 sur les pages récentes (`/marques`).
2. **Settings → Environment Variables** : ajouter toutes les variables du tableau de
   l'étape 2 (environnement **Production**, cocher aussi Preview). Ana copie-colle les
   valeurs depuis son `.env.local` ; l'IA lui dicte la liste et l'ordre, sans jamais
   les afficher elle-même.
3. Vérifier que le repo GitHub est bien connecté (Settings → Git) pour que chaque push
   sur `main` redéploie automatiquement.

## Étape 4 — Vercel Blob (fichiers : logos, moodboards, rapports)

Dashboard Vercel → onglet **Storage** → **Create** → **Blob** → le lier au projet.
Vercel injecte `BLOB_READ_WRITE_TOKEN` automatiquement dans les variables du projet —
vérifier sa présence dans Settings → Environment Variables plutôt que la créer à la main.

## Étape 5 — Déployer et vérifier (bout en bout)

1. Déclencher un déploiement : bouton **Redeploy** sur le dernier build, ou un
   `git push` d'un commit anodin. Attendre l'état « Ready ».
2. Vérifications dans l'ordre, sur l'URL de prod (la noter dans le README si elle
   diffère de `assistrs.vercel.app`) :
   - [ ] `/` s'affiche sans erreur 500 (le tableau de bord, éventuellement vide).
   - [ ] `/marques` s'affiche et la création d'une marque fonctionne.
   - [ ] `/idees` et `/planning` montrent les vues par défaut du seed (pas
     « Aucune vue configurée »).
   - [ ] `/parametres` : générer le lien iCal fonctionne.
   - [ ] Une génération d'idées IA sur `/creation` aboutit (teste `GEMINI_API_KEY`).
   - [ ] Upload d'un logo de marque (teste le Blob).
   - [ ] Cron : `vercel.json` déclare `/api/cron/quotidien` à 6 h UTC — vérifier dans
     le dashboard (onglet Crons du projet) qu'il est bien enregistré ; test manuel
     possible en appelant la route avec l'en-tête `Authorization: Bearer $CRON_SECRET`.
3. Si une page renvoie 500 : lire les **Runtime Logs** du dashboard Vercel (Functions)
   et corriger la variable en cause — ne pas toucher au code.

## Étape 6 — PWA sur iPhone (bonus, 2 min)

Une fois l'URL stable : Safari → ouvrir l'app → Partager → « Sur l'écran d'accueil ».

## Étape 7 — Après CHAQUE futur changement de schema.ts (pas juste au déploiement initial)

**Incident vécu (08/07/2026)** : plusieurs blocs (G11, G13, G14) ont ajouté des colonnes
et une table (`publication_assets`) au schéma sans jamais les pousser sur Turso — le
`db:push` de fin de session tourne sur `.env.local` (`file:local.db`), donc ne touche
que la base locale. Le drift s'est accumulé en silence jusqu'à des erreurs 500 en prod
(« no such column »), détectées par Ana en usage réel plutôt qu'à la source.

Après **tout** commit qui modifie `src/db/schema.ts`, pousser aussi le schéma sur Turso :

1. Vérifier d'abord si `DATABASE_URL`/`DATABASE_AUTH_TOKEN` sont lisibles en local :
   `npx vercel env pull .env.vercel-production --environment production` (nécessite
   `npx vercel link` une fois par poste). Si le fichier contient des valeurs non vides
   pour ces deux variables → elles ne sont plus marquées **Sensitive**, passer à l'étape 2.
   Si elles reviennent vides alors que `vercel env ls production` les liste bien comme
   `Encrypted` → elles sont marquées **Sensitive** dans Vercel (Settings → Environment
   Variables → icône crayon sur chaque variable → décocher « Sensitive »). Une fois
   décochées, elles redeviennent lisibles via `vercel env pull`.
   **Supprimer `.env.vercel-production` juste après usage** — ne jamais le committer
   (déjà couvert par `.gitignore` via `.env*`, à vérifier si besoin).
2. `set -a && source .env.vercel-production && set +a && npx drizzle-kit push` (ou
   l'équivalent PowerShell `$env:DATABASE_URL=...; $env:DATABASE_AUTH_TOKEN=...`) —
   confirmer les changements listés par drizzle-kit avant de valider.
3. Si Ana préfère ne pas désactiver Sensitive : solution de repli utilisée en
   08/07/2026, une route API temporaire dans l'app (ex. `/api/admin/sync-schema`,
   protégée par `CRON_SECRET`) qui compare `PRAGMA table_info` de chaque table au
   schéma attendu et applique les `ALTER TABLE`/`CREATE TABLE` manquants au runtime
   (elle a accès aux vraies valeurs même Sensitive). À committer, déployer, appeler
   une fois, puis supprimer et redéployer — ne jamais la laisser en prod.
4. Vérifier après coup avec `get_runtime_errors` (MCP Vercel) ou en rechargeant les
   pages concernées : plus d'erreur « no such column »/« no such table ».

## Fin de bloc

- Récapituler : URL de production, liste des variables configurées (noms seulement),
  résultat de chaque vérification de l'étape 5.
- Si l'URL de prod diffère de celle du README, proposer à Ana de mettre à jour le
  README (seule modification de fichier autorisée, avec son accord).
- **S'arrêter là.** La suite, c'est `G8.md`.
