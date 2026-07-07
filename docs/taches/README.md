# Briefs d'exécution pour Claude Code

Un fichier par bloc (`G2.md` → `G12.md`, plus `G5bis.md`), à donner à Claude Code **un par
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

- ✅ **G1 → G7** (dont `G5bis`) : terminés et mergés sur `main` (voir `git log`).
- ⬜ **G8 → G12** — vague « refonte v2 » (juillet 2026), à faire dans cet ordre :
  - `G8.md` — refonte visuelle (thème de la maquette `anyMaria/CrErMaquetteSiteWeb`,
    icônes lucide, shell sidebar/topbar/mobile, mode sombre). Aucun changement fonctionnel.
  - `G9.md` — navigation 8 entrées, fusion Analyse+Bilan+Rituel sous `/bilan`,
    Paramètres allégés (iCal, horaires, intégrations).
  - `G10.md` — vues façon Notion sur Idées/Planifier, pipeline idée → publication →
    Buffer rendu visible, suggestions d'horaires dans le formulaire et le calendrier.
  - `G11.md` — Mesurer visuel (recharts) + synchro des statistiques via l'API Buffer
    (`buffer_post_id`, `Post.metrics`), Accueil graphique sans rangée de CTA.
  - `G12.md` — retours clients dans l'espace de marque + pense-bête d'idées.
    (Indépendant de G10/G11 : peut être fait juste après G9 si besoin.)

> ⚠️ Avant de lancer G8 : réparer le déploiement Vercel (base Turso + variables d'env +
> `db:push`/`db:seed`) — voir le README racine §Déploiement. Ce n'est pas un bloc de
> code, c'est de la configuration à faire par Ana, pas par Claude Code.

## Référence

Chaque brief pointe vers `docs/CONCEPTION.md` (le « pourquoi », le produit) et
`docs/GUIDELINE.md` (le « comment », les specs techniques exactes : schémas, prompts
Gemini, clients Apify/Resend/Blob, pièges connus §11, définition de « terminé » §12).
Les deux documents restent la seule source de vérité ; ces briefs n'en sont qu'un
résumé actionnable.
