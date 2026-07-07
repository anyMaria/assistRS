# Assistant RS — Trinkets Design

Application web personnelle pour gérer la création de contenu, la programmation et les
statistiques réseaux sociaux (usage strictement personnel, sans authentification).

Contexte produit : [`docs/CONCEPTION.md`](docs/CONCEPTION.md). Spécifications techniques :
[`docs/GUIDELINE.md`](docs/GUIDELINE.md).

## Stack

Next.js 16 (App Router), Drizzle ORM + libSQL/Turso, Tailwind v4, Google Gemini (IA),
Apify (recherche d'inspiration), Resend (e-mails), Vercel Blob (fichiers), intégration
Buffer (envoi direct des publications).

## Installation locale

1. **Cloner et installer les dépendances**

   ```bash
   git clone https://github.com/anyMaria/assistRS.git
   cd assistRS
   npm install
   ```

2. **Copier le fichier d'environnement**

   ```bash
   cp .env.example .env.local
   ```

   Voir la section [Variables d'environnement](#variables-denvironnement) ci-dessous pour
   chaque clé. En local, seule `DATABASE_URL=file:local.db` est nécessaire pour démarrer —
   les fonctionnalités IA/Apify/Resend/Blob/Buffer affichent un message d'erreur propre
   tant que leurs clés respectives ne sont pas renseignées.

3. **Créer la base de données locale**

   ```bash
   npm run db:push    # applique le schéma (crée local.db)
   npm run db:seed     # modèles de contenu, créneaux Buffer, vues, couleurs conditionnelles
   ```

4. **Lancer le serveur de développement**

   ```bash
   npm run dev
   ```

   Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

| Variable | Où l'obtenir | Requis pour |
|---|---|---|
| `DATABASE_URL` | — (`file:local.db` en dev, `libsql://…` Turso en prod) | Toute l'app |
| `DATABASE_AUTH_TOKEN` | Console Turso, après création de la base | Prod uniquement |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key | Génération d'idées, légendes, rituel mensuel |
| `GEMINI_MODEL` | optionnel, défaut `gemini-2.5-flash` | — |
| `APIFY_TOKEN` | [console.apify.com](https://console.apify.com) → Settings → API & Integrations | Page « S'inspirer » |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys | Bilan hebdo, invitation rituel |
| `CRON_SECRET` | chaîne aléatoire de ton choix (ex. `openssl rand -hex 32`) | Cron quotidien |
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Storage → Blob → Create | Logos de marque, moodboards, rapports PDF |
| `BUFFER_ACCESS_TOKEN` | [publish.buffer.com/settings/api](https://publish.buffer.com/settings/api) | Envoi direct des publications vers Buffer |

Aucune de ces clés n'est jamais exposée au client : elles ne sont lues que dans des
server actions ou des route handlers (`src/app/api/**`).

## Déploiement (Vercel + Turso + Blob + Resend + Apify)

### 1. Base de données — Turso

1. Créer un compte sur [turso.tech](https://turso.tech) et installer la CLI (`turso auth login`).
2. Créer la base : `turso db create assistrs`.
3. Récupérer l'URL : `turso db show assistrs --url` → `DATABASE_URL`.
4. Créer un token : `turso db tokens create assistrs` → `DATABASE_AUTH_TOKEN`.
5. Appliquer le schéma sur la base Turso : lancer `npm run db:push` en local avec
   `DATABASE_URL` et `DATABASE_AUTH_TOKEN` temporairement pointés vers Turso (ou lancer la
   commande une fois le déploiement Vercel fait, depuis un environnement ayant ces
   variables).

### 2. Stockage — Vercel Blob

1. Sur [vercel.com/dashboard](https://vercel.com/dashboard) → onglet **Storage** → **Create
   Database** → **Blob**.
2. Le token `BLOB_READ_WRITE_TOKEN` est généré automatiquement et peut être lié directement
   au projet (Vercel l'ajoute à ses variables d'environnement).

### 3. E-mails — Resend

1. Créer un compte sur [resend.com](https://resend.com) → **API Keys** → **Create API Key**.
2. Sans domaine vérifié, Resend n'autorise l'envoi qu'à l'adresse associée au compte (voir
   `src/lib/email.ts`) — suffisant pour un usage personnel. Pour envoyer à une autre
   adresse plus tard : vérifier un domaine dans Resend (**Domains** → **Add Domain** → DNS)
   puis mettre à jour le destinataire dans `src/lib/email.ts`.

### 4. Inspiration — Apify

1. Créer un compte sur [apify.com](https://apify.com) (le palier gratuit inclut 5 $ de
   crédits/mois).
2. **Settings** → **API & Integrations** → copier le token par défaut → `APIFY_TOKEN`.
3. Rien d'autre à configurer : les acteurs utilisés (`easyapi/pinterest-search-scraper`,
   etc.) sont publics, l'app les appelle directement.

### 5. Déploiement Vercel

1. [vercel.com/new](https://vercel.com/new) → importer le repo GitHub `anyMaria/assistRS`.
2. Dans **Environment Variables**, ajouter toutes les variables de la section précédente
   (sauf `DATABASE_URL`/`DATABASE_AUTH_TOKEN` si déjà liées via l'intégration Turso, et
   `BLOB_READ_WRITE_TOKEN` si déjà lié via l'intégration Blob).
3. Déployer. Le cron quotidien (`vercel.json`) est activé automatiquement sur le plan
   Hobby (1 exécution/jour, 6 h UTC = 8 h Paris l'été).
4. Une fois en ligne, exécuter `npm run db:seed` une seule fois contre la base Turso de
   prod (modèles de contenu, créneaux par défaut) si ce n'est pas déjà fait à l'étape 1.

### 6. Installation sur iPhone (PWA)

Depuis Safari, ouvrir l'URL de production → bouton **Partager** → **Sur l'écran
d'accueil**. L'icône et le nom « Assist RS » apparaissent comme une app native
(`public/manifest.json` + meta iOS dans `src/app/layout.tsx`).

## Scripts utiles

```bash
npm run dev        # serveur de développement
npm run build       # build de production (à valider avant chaque déploiement)
npm run db:push     # applique src/db/schema.ts à la base (pas de migrations versionnées)
npm run db:seed      # modèles, créneaux Buffer, vues et couleurs par défaut
npm run db:backfill  # backfill ponctuel (étapes de production sur publications existantes)
npm run lint         # ESLint
```

## Recherche globale et capture rapide

- **⌘K** (ou bouton 🔍 sur mobile) : recherche plein texte sur marques, idées,
  publications, moodboards et modèles.
- **Bouton « + »** (bas à droite) : création rapide d'une idée, d'une publication, d'un
  relevé de stats ou d'une entrée de temps, accessible depuis n'importe quelle page.
