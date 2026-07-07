# Briefs d'exécution pour Claude Code

Un fichier par bloc (`G2.md` → `G7.md`, plus `G5bis.md`), à donner à Claude Code **un par
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

## État au 07/07/2026

- ✅ **G1** — Vues Notion + espaces de marque (+ compléments post-G1 du §13 bis de
  `CONCEPTION.md`) : terminé.
- ⬜ **G2 → G7** : à faire, dans cet ordre. `G5bis.md` (intégration Meta) vient après
  `G5.md`, avant `G6.md`.

## Référence

Chaque brief pointe vers `docs/CONCEPTION.md` (le « pourquoi », le produit) et
`docs/GUIDELINE.md` (le « comment », les specs techniques exactes : schémas, prompts
Gemini, clients Apify/Resend/Blob, pièges connus §11, définition de « terminé » §12).
Les deux documents restent la seule source de vérité ; ces briefs n'en sont qu'un
résumé actionnable.
