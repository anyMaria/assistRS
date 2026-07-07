# Tâche G5 bis — Intégration Meta Graph API (Instagram/Facebook)

## Avant de commencer (obligatoire)

- Lis `docs/CONCEPTION.md` §13 ter **en entier** (Intégration Meta Graph API) — c'est la
  spec de référence pour ce bloc.
- **Attention** : contrairement aux autres blocs, `docs/GUIDELINE.md` n'a pas de section
  technique dédiée à Meta (pas de client tout fait comme pour Gemini/Apify/Resend/Blob).
  §13 ter de `CONCEPTION.md` est détaillé (endpoints, permissions, étapes) mais tu devras
  écrire le client Meta toi-même, en suivant le même patron que les autres intégrations :
  fichier unique (`src/lib/meta.ts`), try/catch partout (`GUIDELINE.md` §2.4), échec
  propre, ligne `api_usage` par sync.
- Regarde l'état réel du code : `git log --oneline -15`, `src/db/schema.ts`. G1-G5
  doivent être terminés et intacts avant de commencer ce bloc (c'est explicitement après
  G5 dans le phasage, `CONCEPTION.md` §13).
- Modèle recommandé : **Sonnet** (pas Opus).
- Ce bloc dépend d'une mise en place manuelle côté Ana (compte Business Manager, app
  Meta en mode Développement, token System User — §13 ter section « Mise en place »).
  Si ces prérequis ne sont pas encore en place au moment de coder, implémente quand même
  tout le code en te basant sur `META_SYSTEM_USER_TOKEN` en variable d'environnement, et
  vérifie que l'échec propre s'affiche correctement sans ce token (comme pour les autres
  intégrations).

## Objectif de ce bloc

Remplacer la saisie manuelle des stats Instagram/Facebook par une synchronisation
nocturne automatique via l'API Graph Meta, pilotée d'abord sur la marque Trinkets
Design avant extension aux clients.

## Ce qu'il faut construire

- Schéma : `social_connections` (accountId, platform, externalUserId, status,
  lastSyncAt, lastError) + colonnes ajoutées à `publications`
  (`externalMediaId`, `permalink`, `blobThumbUrl`) et à `stat_snapshots` (`source`).
- Dans l'espace de marque, onglet Contexte : bouton « Connecter Instagram/Facebook » qui
  associe la marque à son ig-user-id / page-id.
- `src/lib/meta.ts` : appels à l'API Graph — liste des médias récents
  (`GET /{ig-user-id}/media`), insights par média, le tout avec le token System User côté
  serveur uniquement.
- Sync nocturne : réutilise le cron quotidien Vercel existant (ou à créer si G6 n'est pas
  encore fait — un seul cron quotidien au total, limite du plan Hobby). Pour chaque
  `social_connections` active : liste des médias → rapprochement avec les publications
  (par `externalMediaId` si déjà lié, sinon marque + plateforme + date ± 1 jour ;
  ambiguïté → carte de confirmation sur l'accueil ; post sans publication correspondante
  → vignette « non liée » dans la Galerie) → récupération des insights (views, reach,
  likes, comments, saved, shares — **attention aux métriques dépréciées depuis la v21**,
  ne pas demander `video_views` hors Reels ni `profile_views`) → écriture d'un
  `stat_snapshot` `source: auto` → copie de la vignette en Vercel Blob (`blobThumbUrl`,
  les URLs CDN Meta expirent) → ligne `api_usage` (service `meta`, coût 0).
- Échec propre : erreur ou token révoqué → `social_connections.status = erreur`, les
  publications de la marque retombent dans « À relever » (saisie manuelle possible), et
  le bilan hebdo (si G6 fait) affichera « ⚠ Connexion Meta à vérifier ». Rien ne doit
  casser le reste de l'app.

## Critères d'acceptation

- [ ] Connexion d'une marque à un compte Instagram/Facebook fonctionne (ou échoue
      proprement sans token).
- [ ] La sync (déclenchée manuellement pour test, ou via le cron) crée des
      `stat_snapshots` `source: auto` cohérents avec les KPI existants.
- [ ] Les vignettes copiées en Blob alimentent la vue Galerie sans saisie manuelle d'URL.
- [ ] Une erreur de sync (token invalide simulé) bascule proprement `social_connections`
      en erreur sans casser la page.
- [ ] `npx tsc --noEmit` et `npm run build` passent, blocs précédents intacts.

## Fin de bloc (obligatoire)

- Un commit local par fonctionnalité terminée, message en français. **Ne pousse pas.**
- Résume ce qui a été fait, ce qui a pu être testé en réel (selon disponibilité du
  Business Manager/token côté Ana) et toute divergence entre ce que tu as codé et
  §13 ter — c'est le bloc le moins spécifié techniquement, il est normal d'avoir des
  questions à remonter à Ana.
- **Arrête-toi ici.** N'enchaîne pas sur G6 : Ana doit valider et ajuster d'abord.
