# assistRS — Document de conception produit (v2)

> **Statut : VALIDÉ le 06/07/2026.** Toutes les suggestions (anciennement marquées 💡)
> ont été acceptées par Ana. Ce document est la référence produit ; le mode d'emploi
> technique pour le modèle exécutant est dans `docs/GUIDELINE.md`.
>
> **Décisions finales** : e-mails envoyés vers `anymaridim@gmail.com` (adresse de test
> Resend au départ, pas de domaine) · les rapports PDF portent la mention « Généré avec
> Assist RS » (pas Trinkets Design) · moodboards par marque **et** par thème.

## 1. Vision

assistRS n'est pas un dashboard de stats : c'est le **studio complet d'une community
manager freelance**. Une utilisatrice unique (Ana, Trinkets Design), plusieurs marques
gérées (la sienne, des clients, des collectivités), trois besoins : créer du contenu qui
ressemble à chaque marque, tenir le rythme de production malgré les délais de validation
client, et prouver la valeur avec des chiffres.

**Principes directeurs :**
1. **La marque d'abord** — toute génération IA est nourrie par l'espace Marque (contexte,
   identité, ligne éditoriale, mémoire de corrections). Jamais de texte générique.
2. **Qualité visuelle non négociable** — l'app ne convertit jamais un fichier ; elle
   recommande le bon format d'export par plateforme.
3. **Coûts maîtrisés** — budget scraping ~5 €/mois : cache agressif, plafonds de
   résultats, compteur de dépense visible. IA : textes courts, prompts compacts.
4. **Vitesse de saisie** — usage mobile fréquent ; gros champs, peu de clics.
5. **Échec propre** — si une API (Gemini, Apify, Resend) ne répond pas, le reste de
   l'app fonctionne normalement.

## 2. Architecture fonctionnelle — 6 pôles

| Pôle | Contenu |
|---|---|
| **Marques** | Espaces de marque façon Canva : contexte, identité, ligne éditoriale, assets, mémoire IA |
| **Créer** | Idées (bibliothèque + IA), légendes + hashtags, recall des tops posts, déclinaisons multi-plateformes |
| **S'inspirer** | Recherche visuelle par thème : Pinterest, Meta Ad Library, LinkedIn Ads — avec garde-fous de coûts |
| **Planifier** | Vues Notion (table/kanban/calendrier), checklist de production, récurrences, deadlines de validation client, export iCal |
| **Mesurer** | Stats, KPI, objectifs, temps passé, import CSV, croisement horaires, rapport PDF mensuel par client |
| **Rituels** | Bilan hebdo (e-mail + in-app), rituel mensuel de calendrier éditorial guidé |

**Transversal** : recherche globale ⌘K, bouton **« + » de capture rapide** accessible
partout (nouvelle idée / nouvelle publication / relevé de stats / minutes de temps),
paramètres (vues, couleurs conditionnelles, mappings CSV, budget API), PWA iPhone
(phase ultérieure).

Navigation v2 : Accueil · Marques · Créer · S'inspirer · Planifier · Mesurer · Bilan · Paramètres.

### 2.1 Le pipeline unique (colonne vertébrale du workflow)

Tout contenu suit le même chemin, sans double saisie :

```
Inspiration ──┐
              ├→ Idée ──« Planifier cette idée »──→ Publication planifiée
Rituel mensuel┘         (statut de l'idée suit          │ checklist de production
                         automatiquement)               │ deadline visuel auto
                                                        ▼
                                              Publication publiée
                                                        │ relevés de stats (J+2, J+7)
                                                        ▼
                                              KPI → Bilan hebdo → Rapport mensuel
```

Règles de cohérence :
- Une idée ne se « publie » jamais elle-même : elle **devient** une publication via le
  bouton « Planifier cette idée » (la publication garde le lien `ideaId`). Le statut de
  l'idée passe automatiquement à « en production » à la planification et « publiée »
  quand la publication l'est. Ana ne met jamais à jour deux statuts à la main.
- Le rituel mensuel et le moteur d'idées produisent des objets du même type — pas de
  format spécial à part.

### 2.2 L'accueil = « Ma journée »

L'accueil répond à une seule question : *qu'est-ce que je fais maintenant ?* Trois blocs,
dans cet ordre :
1. **À produire** — visuels dont la deadline approche ou est dépassée (existant).
2. **À relancer** — publications envoyées au client sans validation après le délai de la
   marque.
3. **À relever** — publications publiées depuis ≥ 2 jours sans relevé de stats, ou dont
   le dernier relevé date de plus de 7 jours (saisie en un clic via le « + »). C'est ce
   qui garantit que les KPI et rapports restent nourris sans effort de mémoire.

Ensuite seulement : les cartes KPI par marque et la progression des objectifs.

### 2.3 Une semaine type (fil narratif)

- **Lundi 8 h** : bilan hebdo par e-mail — deadlines de la semaine, retards de
  validation, publications à relever. Ana ouvre `/bilan`, saisit 2 relevés en retard
  depuis son téléphone.
- **Mardi** : création d'un carrousel pour un client — l'app lui rappelle qu'un post
  similaire avait fait +40 % d'engagement en mars (recall), elle lance une recherche
  Pinterest (0,09 $) pour l'inspiration, épingle 3 visuels au moodboard, génère la
  légende, corrige deux tournures, clique « Mémoriser mes corrections ».
- **Jeudi** : le visuel est prêt, elle coche « envoyé au client » — la relance
  s'armera toute seule si le client tarde.
- **Le 1er du mois** : rituel de 15 minutes — questions guidées par marque, calendrier
  proposé, validation ligne par ligne, deadlines calculées automatiquement.
- **Le 3 du mois** : rapport PDF du mois précédent généré par marque, envoyé aux clients.

## 3. Pôle Marques — l'espace de marque

Remplace la fiche « compte » actuelle (qui devient la fiche d'entrée d'une marque).
Structure en 4 onglets :

### 3.1 Contexte d'entreprise
- Nom, secteur, taille (solo / TPE / PME / collectivité), localisation
- Ce que fait l'entreprise (description libre), offre (produits/services principaux)
- Personnes clés : nom, rôle, e-mail/téléphone, préférences de contact — mini-CRM
- Cible / personas (texte structuré)
- **Positionnement** : en une phrase, ce qui la distingue de ses concurrents
- **Concurrents à surveiller** : liste de comptes/marques (réutilisée par S'inspirer)
- **Saisonnalité & temps forts** : les moments clés de l'année (soldes, marchés de
  Noël, salons…) — réutilisés par le rituel mensuel pour proposer le calendrier
- **Liens** : site, boutique, profils sociaux (URL par plateforme)
- Délai de validation client (jours) + couleur de la marque (existant)

### 3.2 Identité visuelle
- Logos (fichiers → Vercel Blob, accès privé)
- Palette de couleurs (liste de hex nommés)
- Typographies (nom + usage titre/texte)
- Style d'image : description du style photo/illustration + moodboard (images uploadées)
- **Règles d'usage** : interdits graphiques, marges minimales, contrastes (texte libre)
- Assets réutilisables : gabarits, pictos, photos de fond — taggables, recherchables

### 3.3 Ligne éditoriale
- **Message principal** (la grande idée que toute la comm' sert)
- **Messages secondaires** (2-5 messages subordonnés)
- **Piliers de contenu** : 3-5 thèmes récurrents, chacun avec une part indicative
  (ex. Coulisses 30 % / Pédagogie 40 % / Offre 20 % / Communauté 10 %) — le rituel
  mensuel s'en sert pour équilibrer le calendrier
- **Ton de voix** : description + exemples « on dit / on ne dit pas » (paires de phrases)
- **Do's & don'ts** : listes de règles éditoriales
- **Hashtags de base** par plateforme (toujours inclus) + hashtags interdits
- **Politique émojis** : jamais / avec parcimonie / librement — et lesquels
- **CTA récurrents** : les appels à l'action types de la marque
- **Langue(s)** de publication et mentions obligatoires (légales, crédits photo)

### 3.4 Mémoire de corrections (IA)
Liste de règles apprises, chacune : texte de la règle, date, origine (« correction du
12/07 sur légende Instagram »), actif/inactif. Alimentée par le bouton **« Mémoriser mes
corrections »** (voir 4.2). Injectée dans tous les prompts de la marque. Éditable et
supprimable à la main.

## 4. Pôle Créer

### 4.1 Idées (existant, enrichi)
Bibliothèque de modèles filtrable + génération IA de 3-5 idées à partir du profil de
marque + thème. Chaque idée retenue garde son statut (idée / en production / publiée).

### 4.2 Génération de légende + hashtags — le flow clé
1. Depuis une publication planifiée (ou une idée), bouton **« Rédiger la légende »**.
2. Le prompt embarque : plateforme + format, contexte marque (3.1), ligne éditoriale
   (3.3), mémoire de corrections (3.4), le brief de la publication, et les règles
   anti-slop (pas de formules creuses, pas d'avalanche d'émojis, concret, rythmé).
3. Le texte s'affiche dans un **éditeur inline** (textarea stylée) — Ana modifie
   directement.
4. Deux actions :
   - **↵ Appliquer** : la légende (telle qu'éditée) est enregistrée sur la publication.
   - **🧠 Mémoriser mes corrections** : l'app envoie à l'IA le texte généré + le texte
     corrigé ; l'IA en déduit 1-3 règles courtes (« Ana remplace "N'hésitez pas à" par
     un impératif direct ») ; les règles s'ajoutent à la mémoire de la marque après
     aperçu/confirmation.
5. Bouton optionnel **« Améliorer mon texte »** : quand Ana a écrit elle-même une
   légende, un clic explicite (jamais automatique, pour économiser les jetons) la fait
   relire dans le ton de la marque avec stop-slop.

### 4.3 Recall des publications performantes
Quand Ana crée une publication/idée avec un thème ou pilier déjà utilisé, l'app détecte
les anciennes publications **au-dessus de la médiane d'engagement de la marque** qui
partagent ce pilier/thème et affiche un encart « Ça avait bien marché » : titre, stats,
lien, et ce qui est réutilisable (format, accroche, créneau). Détection déterministe
(correspondance pilier/mots du thème) — pas d'appel IA.

### 4.4 Déclinaisons multi-plateformes
Bouton « Décliner vers… » sur une publication : crée une copie pour l'autre plateforme
(brief et légende à adapter via 4.2 si souhaité) et affiche le **rappel de format** :

| Contenu | Format d'export | Dimensions |
|---|---|---|
| Post/carrousel IG & FB | PNG (ou JPG qualité max) | 1080 × 1350 (4:5) |
| Reel / Story | MP4 H.264 / PNG story fixe | 1080 × 1920 (9:16) |
| Post LinkedIn | PNG | 1200 × 627 ou 1080 × 1350 |
| Carrousel LinkedIn | **PDF** (document natif) | 1080 × 1080 ou 1080 × 1350 |
| Épingle Pinterest | PNG | 1000 × 1500 (2:3) |

Règle affichée : toujours ré-exporter depuis le fichier source, jamais convertir un
export. Page de référence complète dans Paramètres. **L'app ne convertit aucun fichier.**

## 5. Pôle S'inspirer

### 5.1 Flow
1. Ana saisit un **thème** (+ marque optionnelle → enrichit la requête avec le secteur).
2. Elle coche les **sources** à interroger (aucune n'est lancée par défaut).
3. Résultats en grille visuelle : image, auteur, date, signaux de performance
   disponibles, lien vers l'original. Filtres : source, format, période, tri.
4. Chaque visuel peut être **épinglé dans un moodboard** (par marque ou par thème) —
   l'aperçu est alors copié dans Vercel Blob (les URLs d'images scrapées expirent).

### 5.2 Sources et coûts (tarifs vérifiés juillet 2026)

| Source | Actor Apify | Tarif | Coût pour 30 résultats |
|---|---|---|---|
| Pinterest | `easyapi/pinterest-search-scraper` | 2,99 $/1000 | ~0,09 $ |
| Instagram | `apify/instagram-scraper` | 2,70 $/1000 (plan Free) | ~0,08 $ |
| LinkedIn (posts) | `harvestapi/linkedin-post-search` | 1,50-2 $/1000 | ~0,06 $ |
| Facebook (posts) | `apify/facebook-posts-scraper` | 2 $ affiché, **5-8 $/1000 réels** | ~0,15-0,24 $ |
| Meta Ad Library | `whoareyouanas/meta-ad-scraper` | **10 $/1000** | ~0,30 $ |

Signaux de performance par source : Pinterest = enregistrements ; Instagram = likes/
commentaires ; LinkedIn = réactions ; Meta Ads = **durée de diffusion** (une pub qui
tourne depuis des semaines est une pub qui rapporte — c'est le meilleur signal).

### 5.3 Garde-fous de coûts (budget ~5 €/mois)
1. **Plafond par recherche** : 30 résultats max par source (paramétrable, jamais > 50).
2. **Cache 14 jours** : une recherche (thème + source + filtres normalisés) déjà faite
   ressert ses résultats stockés en base — 0 $.
3. **Sources sur demande explicite** : cases à cocher, pré-cochée = Pinterest seule
   (la moins chère et la plus « inspiration visuelle »).
4. **Compteur de budget** : chaque run enregistre son coût estimé (table `api_usage`) ;
   une barre de budget mensuel s'affiche sur la page ; blocage doux à 4,50 $ (message +
   bouton « lancer quand même »).
5. **Meta Ads en dernier recours** : le plus cher — l'UI le signale (« ~0,30 $ »).
6. L'abonnement **Apify Free inclut 5 $ de crédits/mois** : bien configuré, le budget
   réel peut être ~0 € les mois calmes.

Capacité estimée avec ces règles : **40 à 60 recherches/mois**, soit 1 à 2 par jour ouvré.

### 5.4 Intégration technique
Appels REST directs à l'API Apify (`APIFY_TOKEN` en variable d'environnement, jamais
côté client). Le MCP Apify (`https://mcp.apify.com/?tools=...`) sert à **moi** pendant la
conception pour tester les actors ; l'app en production appelle l'API HTTP d'Apify.

## 6. Pôle Planifier

Existant (vues Notion table/kanban/calendrier, couleurs conditionnelles, deadlines de
validation) + ajouts :

1. **Checklist de production** par publication : brief → maquette → envoyé au client
   (date) → validé (date) → programmé. Chaque étape a une case + date. La date « envoyé
   au client » déclenche le suivi de relance : si pas de validation après le délai de la
   marque, l'app le signale dans le bilan. Checklist modifiable par marque (étapes
   personnalisables).
2. **Récurrences** : « post FAQ tous les lundis 11 h sur IG » → génère automatiquement
   les publications planifiées du mois à venir (statut « récurrente », annulables une à une).
3. **Duplication en un clic** d'une publication ou d'une idée (vers même marque ou une autre).
4. **Export iCal** : flux `/api/ical/<token>` avec les deadlines visuel + dates de
   publication — abonnable depuis Google Calendar/iPhone. Token secret révocable.

## 7. Pôle Mesurer

Existant (relevés, KPI, comparaisons, import CSV avec mapping, croisement horaires) + :

1. **Objectifs par marque** : métrique (abonnés, engagement, conversions), cible,
   période — barre de progression sur l'accueil et dans le rapport.
2. **Temps passé** : saisie rapide (minutes) par publication ou par marque, total
   mensuel — base de facturation. Taux horaire optionnel par marque → valorisation.
3. **Rapport mensuel PDF par marque** : page de garde aux couleurs de la marque, KPI du
   mois vs mois précédent, top 3 publications, progression des objectifs, temps passé
   (valorisé si taux horaire renseigné), recommandations (section IA optionnelle).
   Pied de page : « Généré avec Assist RS ». Généré avec `@react-pdf/renderer`
   (serverless-friendly), stocké dans Blob, téléchargeable/envoyable.
5. **Relevés guidés** : une publication publiée apparaît dans « À relever » (accueil +
   bilan) à J+2 puis J+7 — c'est le mécanisme qui garantit des données fraîches sans
   rappels intrusifs.
4. **Créneaux personnalisés auto-calculés** : dès ≥ 10 publications avec stats sur une
   plateforme, l'app calcule les créneaux réellement performants et propose : « Mettre à
   jour ta grille avec tes vraies meilleures heures ? » (diff visuel avant application).

## 8. Pôle Rituels

1. **Bilan hebdomadaire** (lundi 8 h Paris, cron Vercel) — e-mail via Resend vers
   `anymaridim@gmail.com` **et** page `/bilan` : deadlines de la semaine, publications à
   programmer, validations client en retard, publications « à relever », stats
   marquantes de la semaine passée. Ton bref, actionnable.
2. **Rituel mensuel** (1er du mois) — notification e-mail + bandeau in-app : « 15 min
   pour préparer le mois ». Wizard marque par marque :
   - Questions : quoi de neuf ? promos/lancements ? événements ? contraintes ?
     (pré-remplies avec la saisonnalité de la marque)
   - L'IA propose un **calendrier éditorial du mois** : X publications réparties selon
     les piliers et la grille horaire, chacune avec thème + format + accroche.
   - Ana valide/édite/supprime ligne par ligne → les retenues deviennent des
     publications planifiées (et leurs deadlines visuel se calculent toutes seules).
3. Les rappels unitaires n'existent pas : tout passe par ces bilans (choix d'Ana).

## 9. Recherche globale

⌘K (et bouton 🔍 mobile) : recherche plein texte sur marques, idées, publications,
moodboards, modèles. Implémentation simple : requêtes LIKE sur SQLite (suffisant
mono-utilisatrice), résultats groupés par type.

## 10. Modèle de données v2 (delta)

Tables existantes conservées : `accounts` (devient la racine « marque »), `ideas`,
`publications`, `stat_snapshots`, `time_slots`, `csv_mappings`, `view_configs`,
`color_rules`, `content_templates`.

Nouvelles tables :
- `brand_profiles` (1-1 accounts) : description, offering, positioning, personas,
  keyPeople JSON, competitors JSON, seasonality JSON, links JSON
- `brand_identity` (1-1) : palette JSON, fonts JSON, imageStyle, usageRules
- `brand_assets` (1-n) : type (logo|gabarit|photo|moodboard), blobUrl, name, tags JSON
- `brand_editorial` (1-1) : mainMessage, secondaryMessages JSON, pillars JSON
  (name, sharePercent), toneVoice, toneExamples JSON, dos JSON, donts JSON,
  baseHashtags JSON, bannedHashtags JSON, emojiPolicy, ctas JSON, languages, legalMentions
- `brand_memory_rules` (1-n) : rule, origin, active, createdAt
- `generations` (1-n) : accountId, publicationId?, kind (legende|idees|calendrier|
  analyse|amelioration), promptSummary, output, editedOutput, appliedAt, createdAt
- `inspiration_searches` : theme, sources JSON, filters JSON, costCents, createdAt
- `inspiration_items` : searchId, source, imageUrl, blobThumbUrl?, author, postedAt,
  metrics JSON, originalUrl, pinnedBoardId?
- `moodboards` : accountId?, name — et l'épinglage via `inspiration_items.pinnedBoardId`
- `production_steps` (1-n publications) : key (brief|maquette|envoye|valide|programme),
  done, doneAt — étapes par défaut créées avec la publication
- `recurrences` : accountId, platform, format, titlePattern, dayOfWeek, hour, freq
  (hebdo|mensuel), active, lastGeneratedUntil
- `goals` : accountId, metric, target, periodStart, periodEnd
- `time_entries` : accountId, publicationId?, minutes, note, date
- `reports` : accountId, month, blobUrl, createdAt
- `monthly_rituals` : month, accountId, answers JSON, proposal JSON, status
- `api_usage` : service (apify|gemini|resend), action, costCents, createdAt
- `ical_tokens` : token, revokedAt

## 11. Intégrations & secrets (tous côté serveur)

| Service | Usage | Variable |
|---|---|---|
| Google Gemini | génération/analyse — **palier gratuit** (~1 500 req/jour), clé créée sur aistudio.google.com | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Apify | scrapers S'inspirer (5 actors §5.2) | `APIFY_TOKEN` |
| Resend | bilans + rituels + envoi de rapports — destinataire `anymaridim@gmail.com`, expéditeur `onboarding@resend.dev` tant qu'aucun domaine n'est vérifié | `RESEND_API_KEY` |
| Vercel Blob | logos, assets, moodboards, rapports PDF (`access: "private"`) | `BLOB_READ_WRITE_TOKEN` |
| Turso | base de données prod | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` |

Chaque appel externe : try/catch, message d'erreur français clair, fonctionnalité
dégradée sans casser la page, et ligne `api_usage` pour le suivi de coût.

## 12. Design

Direction « atelier éditorial » (papier #F6F2EA, encre #1C1917, **rouge signature
#DE2F2C** choisi par Ana, Fraunces + Work Sans, bordures franches, ombres dures). La
charte UX/UI complète — palette, hiérarchie, états interactifs, feedbacks, accessibilité,
mobile — est dans `GUIDELINE.md` §2.3 et est **contractuelle** : l'esthétique et
l'interactivité font partie du produit. Mobile : saisie de stats, checklists et bilan
optimisés en priorité. PWA iPhone en phase finale (manifest, icônes, web push iOS ≥ 16.4).

## 13. Phasage d'exécution (pour le guideline)

- **G1** — Terminer les vues Notion (WIP) + refonte Marques (4 onglets, Blob, assets)
- **G2** — Créer : légendes IA + mémoire de corrections + recall + déclinaisons/formats
- **G3** — S'inspirer : intégration Apify + cache + budget + moodboards
- **G4** — Planifier+ : checklists, récurrences, duplication, iCal
- **G5** — Mesurer+ : objectifs, temps, rapports PDF, créneaux auto, import CSV
- **G6** — Rituels : bilan hebdo (Resend + cron), rituel mensuel guidé
- **G7** — Recherche ⌘K, page formats, polish, PWA, déploiement Vercel+Turso

## 14. Glossaire (vocabulaire unique, utilisé partout dans l'UI et le code)

| Terme | Définition |
|---|---|
| **Marque** | Un compte géré (Trinkets Design, un client, une collectivité). Entité racine. |
| **Espace de marque** | La fiche complète d'une marque : contexte, identité, ligne éditoriale, mémoire IA. |
| **Pilier** | Thème récurrent de la ligne éditoriale, avec une part indicative (ex. Coulisses 30 %). |
| **Idée** | Un concept de contenu, pas encore daté. Devient une publication via « Planifier ». |
| **Publication** | Un contenu daté sur une plateforme (planifiée ou publiée). |
| **Brief** | Le descriptif d'une publication (sujet, angle, structure). |
| **Deadline visuel** | Date limite de création = date de publication − délai de validation de la marque. |
| **Checklist de production** | Les 5 étapes : brief → maquette → envoyé au client → validé → programmé. |
| **Relevé** | Une saisie de stats à une date donnée (plusieurs relevés par publication). |
| **Créneau** | Un jour + heure recommandé pour publier (force 1 à 3). |
| **Recall** | Encart « ça avait bien marché » qui ressort une ancienne publication performante. |
| **Moodboard** | Collection de visuels d'inspiration épinglés (par marque ou par thème). |
| **Mémoire de corrections** | Règles d'écriture apprises des retouches d'Ana, injectées dans les prompts. |
| **Bilan** | Le digest hebdo (e-mail + page /bilan). |
| **Rituel mensuel** | La session guidée de 15 min qui produit le calendrier éditorial du mois. |
