# Briefs d'exécution pour Claude Code

Un fichier par bloc (`G2.md` → `G15.md`, plus `G5bis.md`), à donner à Claude Code **un par
un, dans l'ordre**. Chaque fichier est autonome : il dit quoi lire, quoi construire,
comment savoir que c'est fini, et où s'arrêter.

## Comment les utiliser

1. Donne à Claude Code le contenu d'un seul fichier (ex. `docs/taches/G2.md`) — pas
   plusieurs à la fois.
2. À la fin du bloc, Claude Code s'arrête et commit en local (jamais de `git push`
   automatique — déjà une règle du `GUIDELINE.md` §11).
3. Ana relit, teste, ajuste (`npm run dev`, mot de passe `trinkets`) et demande les
   retouches nécessaires **avant** de passer au fichier suivant.
4. Une fois G2 validé → `G3.md`, etc. Ne jamais sauter un bloc.

## Modèle recommandé

**Sonnet** (pas Opus) pour tous ces blocs. Ils sont volontairement scopés à une
fonctionnalité à la fois (règle d'or n°1 du `GUIDELINE.md`), donc pas besoin du modèle le
plus puissant/coûteux — ça limite la consommation de jetons. Démarre la session avec le
modèle Sonnet sélectionné (`/model sonnet` ou équivalent dans ton interface Claude Code)
avant de coller le brief.

## État au 08/07/2026

- ✅ **G1 → G7** (dont `G5bis`) : terminés et mergés sur `main` (voir `git log`).
- ✅ **G9, G10** : faits (commits `240d379`, `5ec7425`). Nota : après leur rédaction,
  Créer + S'inspirer + Idées ont été **fusionnés en `/conception`** (avec redirections
  depuis les anciennes routes) — c'est l'état de référence, pas une anomalie.
- ⬜ **Restants**, à faire dans cet ordre :
  1. `G13.md` — fiabiliser S'inspirer : ingestion par **webhook Apify** (corrige le
     bug des recherches bloquées « en cours »), rattrapage + retry, pré-chauffe
     hebdo par le cron, requêtes et tri de pertinence via Gemini.
     **Indépendant de tout — à faire en premier (bug réel).**
  2. `G14.md` — médias Buffer : upload transitoire Vercel Blob (photos, public),
     vrai carrousel multi-images, purge automatique J+7, bouton « Envoyer la
     semaine sur Buffer ». Pas de vidéo en v1, jamais de conversion d'assets.
  3. `G8.md` — refonte visuelle (thème de la maquette `anyMaria/CrErMaquetteSiteWeb`,
     icônes lucide, shell sidebar/topbar/mobile, mode sombre). Aucun changement
     fonctionnel. ⚠️ Rédigé avant la fusion `/conception` : appliquer ses consignes
     aux pages telles qu'elles existent aujourd'hui.
  4. `G11.md` — Mesurer visuel (recharts) + synchro des statistiques via l'API Buffer
     (`Post.metrics`), Accueil graphique sans rangée de CTA. ⚠️ Si G14 a déjà créé
     `buffer_post_id`, sauter son §1.
  5. `G12.md` — retours clients dans l'espace de marque + pense-bête d'idées.
  6. `G15.md` — refonte de Conception : 2 onglets sans rechargement, générateur IA
     en panneau (bouton accent), kanban « Pipeline » par défaut, cartes à 2 badges,
     légende/planification dans le panneau de détail. **Requiert G8.**

> ⚠️ Avant de lancer G13 : réparer le déploiement Vercel — brief dédié
> `DEPLOIEMENT.md` (Turso, toutes les clés, variables Vercel, Blob, vérification de
> bout en bout). C'est de la configuration guidée pas à pas, pas du code. Les
> webhooks Apify de G13 exigent une URL publique (`APP_URL`) : sans déploiement,
> seul le fallback polling est testable.

## Référence

Chaque brief pointe vers `docs/CONCEPTION.md` (le « pourquoi », le produit) et
`docs/GUIDELINE.md` (le « comment », les specs techniques exactes : schémas, prompts
Gemini, clients Apify/Resend/Blob, pièges connus §11, définition de « terminé » §12).
Les deux documents restent la seule source de vérité ; ces briefs n'en sont qu'un
résumé actionnable.
