# NetAprèsTax — Notes de développement

---

## Architecture technique

### Stack

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.3 |
| Langage | TypeScript (strict) | 5.x |
| CSS | Tailwind CSS | 4.x |
| ORM | Prisma | 7.5.0 |
| Base de données | PostgreSQL (Neon Frankfurt) | — |
| Auth | Better Auth | 1.5.5 |
| Fichiers | Vercel Blob (store privé) | 2.3.1 |
| Email | Resend | 6.9.3 |
| PDF | html2pdf.js (client-side) | 0.14.0 |
| Graphiques | Recharts | 3.8.0 |
| Icônes | Lucide React | 0.577.0 |
| Validation | Zod | 4.3.6 |
| Formulaires | React Hook Form | 7.71.2 |
| Tests | Vitest | 4.1.0 |
| Hébergement | Vercel | — |

### Structure des dossiers

```
src/
├── app/
│   ├── (auth)/                    # Pages auth (login, register, forgot/reset-password)
│   ├── (legal)/                   # Pages légales (cgu, mentions-legales, confidentialite)
│   ├── accountant/
│   │   ├── login/                 # Login comptable dédié
│   │   └── dashboard/             # Dashboard comptable (lecture seule)
│   │       ├── page.tsx           # Liste des clients
│   │       ├── layout.tsx         # Layout avec nav + déconnexion
│   │       └── [clientId]/        # Vue client
│   │           ├── page.tsx       # Dashboard client (RSC)
│   │           ├── layout.tsx     # Layout avec bannière lecture seule + nav
│   │           ├── revenue/       # Revenus (lecture seule)
│   │           ├── expenses/      # Frais (lecture seule)
│   │           ├── invoices/      # Factures (lecture seule)
│   │           ├── quotes/        # Devis (lecture seule)
│   │           └── history/       # Historique graphiques (lecture seule)
│   ├── api/
│   │   ├── auth/[...all]/         # Better Auth catch-all
│   │   ├── accountant-access/     # GET/POST/DELETE gestion accès comptable
│   │   ├── accountant/clients/    # GET liste clients du comptable
│   │   ├── accountant/[clientId]/ # Routes lecture seule comptable
│   │   │   ├── revenue/           # GET revenus client
│   │   │   ├── expenses/          # GET frais client
│   │   │   ├── invoices/          # GET factures client
│   │   │   ├── quotes/            # GET devis client
│   │   │   └── history/           # GET historique client
│   │   ├── alerts/                # GET alertes seuil CA
│   │   ├── attachments/           # GET (proxy privé) + DELETE pièces jointes
│   │   ├── attachments/upload/    # POST upload vers Vercel Blob
│   │   ├── clients/               # CRUD clients
│   │   ├── cron/check-alerts/     # Cron quotidien 8h UTC
│   │   ├── expenses/              # CRUD frais
│   │   ├── export/csv/            # Export CSV
│   │   ├── export/pdf/            # Export PDF
│   │   ├── history/               # Historique annuel
│   │   ├── invoices/              # CRUD factures
│   │   ├── invoices/[id]/         # GET/PUT/PATCH/DELETE facture
│   │   ├── invoices/[id]/credit-note/ # POST avoir
│   │   ├── invoices/pdf/          # Génération HTML facture
│   │   ├── onboarding/            # POST onboarding fiscal
│   │   ├── quotes/                # CRUD devis
│   │   ├── quotes/[id]/           # GET/PUT/PATCH/DELETE devis
│   │   ├── quotes/[id]/convert/   # POST conversion devis → facture
│   │   ├── quotes/pdf/            # Génération HTML devis
│   │   ├── revenue/               # CRUD revenus
│   │   └── settings/              # GET/PUT paramètres
│   ├── dashboard/
│   │   ├── page.tsx               # Tableau de bord principal
│   │   ├── alerts/                # Alertes seuils CA + TVA
│   │   ├── clients/               # Répertoire clients
│   │   ├── expenses/              # Gestion frais
│   │   ├── export/                # Export données
│   │   ├── history/               # Historique graphiques
│   │   ├── invoices/              # Liste + détail factures
│   │   ├── quotes/                # Liste + détail devis
│   │   ├── revenue/               # Gestion revenus
│   │   ├── settings/              # Paramètres utilisateur + section accès comptable
│   │   └── simulation/            # Simulation fiscale
│   ├── onboarding/                # Onboarding 4 étapes
│   ├── layout.tsx                 # Layout racine (fonts Geist)
│   ├── page.tsx                   # Landing page + footer
│   └── globals.css                # Tailwind + variables CSS thème
├── components/
│   ├── dashboard/                 # mobile-nav, month-picker, sign-out-button
│   └── invoicing/                 # line-items-editor, status-badge
├── lib/
│   ├── auth.ts                    # Config Better Auth (email + Google OAuth)
│   ├── auth-client.ts             # Client-side auth
│   ├── db.ts                      # Singleton Prisma + PrismaPg adapter
│   ├── utils.ts                   # Utilitaires
│   ├── fiscal/
│   │   ├── engine.ts              # Moteur calcul fiscal (IR, cotisations, CFP, net)
│   │   ├── rates.ts               # Barèmes et taux 2026
│   │   ├── types.ts               # Types fiscaux
│   │   └── __tests__/engine.test.ts # 32 tests unitaires
│   └── invoicing/
│       ├── calculations.ts        # Calculs HT/TVA/TTC par ligne et document
│       ├── numbering.ts           # Numérotation séquentielle (FAC/DEV/AV-YYYY-XXX)
│       └── pdf-template.ts        # Template HTML pour factures/devis/avoirs
├── proxy.ts                       # Middleware auth (redirections session)
└── generated/prisma/              # Client Prisma généré (commité pour Turbopack)
```

### Schéma Prisma — modèles principaux

```
User ──────────── FiscalProfile (1:1)
  │
  ├── Revenue (1:N)     ── Invoice? (1:1 optionnel via invoiceId)
  ├── Expense (1:N)
  ├── AlertLog (1:N)
  ├── Client (1:N) ──── Quote (1:N) ── DocumentLine (1:N)
  │                └─── Invoice (1:N) ── DocumentLine (1:N)
  │                                   ── Invoice[] (self-ref: creditNotes)
  ├── AccountantAccess (1:N, "AccountantUser") ── User (comptable → clients)
  ├── AccountantAccess (1:N, "ClientUser")     ── User (client → comptables)
  ├── Session (1:N)
  ├── Account (1:N)
  └── Verification (1:N)
```

**Enums :**
- `ActivityType` : BIC_VENTE, BIC_PRESTATION, BNC_LIBERAL_URSSAF, BNC_LIBERAL_CIPAV
- `DeclarationFrequency` : MENSUELLE, TRIMESTRIELLE
- `ExpenseCategory` : LOGICIEL, TRANSPORT, MATERIEL, TELEPHONE, BUREAU, FORMATION, ASSURANCE, AUTRE
- `QuoteStatus` : DRAFT, SENT, ACCEPTED, REFUSED
- `InvoiceStatus` : DRAFT, PENDING, PAID, OVERDUE, CANCELLED
- `AlertType` : SEUIL_75, SEUIL_90, SEUIL_100, TVA_APPROCHE, TVA_DEPASSE
- `UserRole` : USER, ACCOUNTANT
- `AccessStatus` : PENDING, ACTIVE, REVOKED

**Champs notables sur Revenue :**
- `invoiceId` (unique, optionnel) — lie le revenu à la facture source
- `locked` (boolean) — empêche suppression des revenus issus de factures
- `attachmentUrl` / `attachmentName` — pièce jointe via Vercel Blob

**Champs notables sur Invoice et Quote :**
- `paymentMethod` — moyen de paiement (Virement bancaire, Chèque, Espèces, Carte bancaire, Autre)
- `bankAccountHolder` / `bankIban` / `bankBic` — coordonnées bancaires (uniquement si virement)

### Variables d'environnement

**Requises :**
```
DATABASE_URL                # PostgreSQL Neon (ep-shiny-brook-ag6qrbr6, Frankfurt)
BETTER_AUTH_URL             # URL de base (https://netaprestax.vercel.app)
BETTER_AUTH_SECRET          # Secret JWT/sessions
BLOB_READ_WRITE_TOKEN       # Token Vercel Blob (store privé)
RESEND_API_KEY              # Clé API Resend pour emails
```

**Optionnelles :**
```
GOOGLE_CLIENT_ID            # OAuth Google (pas encore activé)
GOOGLE_CLIENT_SECRET        # OAuth Google
CRON_SECRET                 # Auth pour endpoints cron
```

### Choix techniques importants

1. **Prisma client commité dans git** — nécessaire pour le build Vercel avec Turbopack, sinon erreur d'import au deploy
2. **Store Vercel Blob privé** — les pièces jointes sont servies via un proxy server-side (`GET /api/attachments`) qui vérifie l'ownership avant de streamer le fichier. Aucune URL blob exposée au client
3. **PDF client-side (html2pdf.js)** — le serveur génère du HTML (`/api/invoices/pdf`), le client le convertit en PDF via html2pdf.js. Évite les dépendances lourdes (Puppeteer/Chromium) côté serverless
4. **Revenus liés aux factures** — quand une facture est marquée payée, le revenu créé est verrouillé (`locked: true`) et lié via `invoiceId`. La suppression via avoir utilise cette relation directe au lieu d'un match fragile par description
5. **Moteur fiscal isolé** — `src/lib/fiscal/` est un module pur (pas de dépendances DB/API) avec 32 tests unitaires. Barèmes 2026 dans `rates.ts`
6. **Cron Vercel quotidien** — `vercel.json` configure un cron à 8h UTC qui vérifie les seuils CA et envoie des alertes email via Resend
7. **Body size limit 6MB** — `next.config.ts` configure `serverActions.bodySizeLimit` pour les uploads de pièces jointes (max 5MB côté validation)

### Thème CSS

```
--primary: #2563eb (bleu)
--accent: #10b981 (vert émeraude)
--destructive: #ef4444 (rouge)
--background: #ffffff
--foreground: #0f172a (slate foncé)
--muted-foreground: #64748b (slate)
--border: #e2e8f0
```

### Déploiement

- **GitHub** : https://github.com/devnako/netaprestax.git (privé)
- **Vercel** : https://netaprestax.vercel.app
- **DB** : Neon PostgreSQL Frankfurt (`ep-shiny-brook-ag6qrbr6`)
- **Auto-deploy** : chaque push sur `main` déclenche un déploiement

---

## Historique de développement

### Fait — 19 mars 2026 (session 6)

- **Revert aperçu PDF navigateur** :
  - Tentatives d'aperçu PDF dans le navigateur (via `html2pdf.js` `.output("blob")` + `window.open`) abandonnées
  - Problème : html2canvas nécessite des éléments visibles dans le DOM → flash de HTML non stylisé
  - Tentatives : `position: fixed; left: -9999px` (page blanche), `opacity:0 + onclone` (idem)
  - Revert complet vers commit `662efde` : retour au téléchargement PDF direct via `.save()`
- **Icônes pièces jointes sur revenus comptable** :
  - Le revert avait supprimé les icônes pièces jointes de la page revenus comptable
  - Restauré avec le même pattern que la page frais comptable :
    - Revenu lié à une facture : icône Download qui télécharge le PDF (même bouton que l'onglet factures)
    - Revenu avec pièce jointe : icône Image/FileText qui ouvre via `window.open`
  - Fichier modifié : `src/app/dashboard/mes-clients/[clientId]/revenue/page.tsx`

### Fait — 18 mars 2026 (session 5)

- Accès comptable en lecture seule :
  - Modèle Prisma `AccountantAccess` avec enums `UserRole` (USER/ACCOUNTANT) et `AccessStatus` (PENDING/ACTIVE/REVOKED)
  - `src/lib/accountant.ts` : helpers `verifyAccountantAccess` et `getAccountantSession`
  - Login comptable dédié (`/accountant/login`) sans Google OAuth
  - Dashboard comptable (`/accountant/dashboard`) avec liste des clients
  - Vue client lecture seule avec bannière bleue "Mode lecture seule" :
    - Dashboard principal (RSC, stat cards, détail calcul, barre CA annuel)
    - Revenus, frais, factures, devis (listes sans actions de modification)
    - Historique avec graphiques Recharts
  - 7 routes API comptable avec vérification d'accès (`/api/accountant/clients`, `/api/accountant/[clientId]/*`)
  - Route API `/api/accountant-access` : GET/POST/DELETE pour gérer les accès
  - Section "Accès comptable" dans les paramètres utilisateur (invitation par email, révocation)
  - Liens vers l'espace comptable sur les pages login et register
  - Middleware `proxy.ts` mis à jour pour protéger `/accountant/dashboard`

### Fait — 17 mars 2026 (session 4)

- Moyen de paiement sur factures et devis :
  - Champs `paymentMethod`, `bankAccountHolder`, `bankIban`, `bankBic` ajoutés sur Invoice et Quote (Prisma)
  - Sélecteur dans les formulaires de création facture et devis (Virement bancaire, Chèque, Espèces, Carte bancaire, Autre)
  - Si "Virement bancaire" : champs optionnels titulaire du compte, IBAN, BIC
  - Affichage sur les pages détail facture et devis (encart bleu coordonnées bancaires)
  - Édition possible en mode modification de facture
  - Section "Règlement" en bas du PDF avec moyen de paiement + coordonnées bancaires si applicable
  - Champs copiés lors de la conversion devis → facture et de la duplication de devis
- Fix du PATCH `/api/invoices/[id]` : supporte maintenant les éditions de contenu (lignes, notes, conditions, moyen de paiement) en plus des changements de statut

### Fait — 17 mars 2026 (session 3)

- Vercel Blob passé en mode **privé** (`access: "private"`)
  - Route GET `/api/attachments` proxy : vérifie ownership, fetch le blob privé côté serveur, stream au client
  - Aucune URL blob exposée côté client
- Revenus liés aux factures :
  - Champs `invoiceId` (unique) et `locked` ajoutés au modèle Revenue
  - Quand une facture est marquée payée, le revenu créé est lié via `invoiceId` + `locked: true`
  - Page Revenus : icône cadenas, lien "Voir la facture", icône fichier vers la facture
  - Revenus verrouillés : pas de suppression, pas d'upload/suppression de pièce jointe
  - Suppression du revenu via avoir utilise `invoiceId` au lieu du match fragile description+montant

### Fait — 17 mars 2026 (session 2)

- Pièces jointes Revenus/Frais : UI complète (upload, affichage, suppression)
  - Champs `attachmentUrl` / `attachmentName` ajoutés sur Revenue et Expense (Prisma)
  - Route API `/api/attachments/upload` (POST) — upload server-side vers Vercel Blob
  - Route API `/api/attachments` (DELETE) — suppression blob + reset DB
  - Icône trombone pour uploader, icône fichier/image pour voir, X pour supprimer
  - Validation : PDF/JPG/PNG/WebP, max 5 MB
  - Nettoyage blob automatique à la suppression d'un revenu ou frais
  - `next.config.ts` : `bodySizeLimit: "6mb"` pour les uploads
- Debug upload Vercel Blob : token explicite passé à `put()`, try/catch avec message d'erreur clair

### Fait — 17 mars 2026 (session 1)

- Barre de recherche + navigation par mois dans les factures
- Sélecteur de mois avec calendrier popup sur toutes les pages (Revenus, Frais, Factures, Devis)
- Pages légales : CGU, Mentions légales, Politique de confidentialité
- Footer propre uniquement sur la landing page (3 colonnes : logo, copyright, liens)
- Améliorations factures et devis :
  - Téléchargement PDF direct sans boîte d'impression (html2pdf.js)
  - Informations émetteur/client améliorées (email, téléphone, SIRET sans label)
  - Champ téléphone ajouté sur les clients
  - SIRET et adresse rendus obligatoires dans les paramètres
  - Suppression de la mention "Micro-entreprise" sur les PDF
  - Champ unique "Nom / Prénom ou Nom commercial" dans les paramètres
- Avoirs cachés de la liste principale, visibles uniquement dans l'onglet "Avoirs"
- Repository GitHub passé en privé

### Fait — 15 mars 2026

- Système de facturation complet (devis, factures, avoirs)
- Gestion des clients avec formulaire inline
- Numérotation séquentielle (FAC-2026-XXX, DEV-2026-XXX, AV-2026-XXX)
- Conversion devis → facture
- Génération PDF pour tous les documents
- Vérification profil avant création de document
- Gestion des avoirs (notes de crédit) avec annulation de facture

### Fait — 14 mars 2026

- Setup initial : Next.js 16, Prisma 7, Better Auth, Tailwind v4
- Déploiement Vercel (Neon Frankfurt)
- Landing page
- Authentification (inscription, connexion, mot de passe oublié)
- Onboarding fiscal complet
- Tableau de bord avec résumé mensuel
- Revenus et frais avec CRUD complet
- Historique annuel avec graphiques
- Alertes de seuil CA
- Simulation fiscale
- Export CSV
- Paramètres (profil, fiscal, entreprise, mot de passe)

---

## À faire — Priorité

- **Tester upload pièces jointes** : le store Blob est maintenant en mode privé avec proxy server-side, à vérifier en prod
- **Page d'édition de devis manquante** : le lien "Modifier" sur un devis DRAFT pointe vers `/dashboard/quotes/[id]/edit` qui n'existe pas encore

## À faire — Roadmap

- Stripe + plan Pro
- Rappels de déclaration URSSAF par email (quand nom de domaine ok)
- Envoi de factures par email (quand nom de domaine ok)
- Facturation électronique via Portail Public (2027)
