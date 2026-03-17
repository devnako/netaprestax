# NetAprèsTax — Notes de développement

## Fait — 17 mars 2026 (session 3)

- Vercel Blob passé en mode **privé** (`access: "private"`)
  - Route GET `/api/attachments` proxy : vérifie ownership, fetch le blob privé côté serveur, stream au client
  - Aucune URL blob exposée côté client
- Revenus liés aux factures :
  - Champs `invoiceId` (unique) et `locked` ajoutés au modèle Revenue
  - Quand une facture est marquée payée, le revenu créé est lié via `invoiceId` + `locked: true`
  - Page Revenus : icône cadenas, lien "Voir la facture", icône fichier vers la facture
  - Revenus verrouillés : pas de suppression, pas d'upload/suppression de pièce jointe
  - Suppression du revenu via avoir utilise `invoiceId` au lieu du match fragile description+montant

## Fait — 17 mars 2026 (session 2)

- Pièces jointes Revenus/Frais : UI complète (upload, affichage, suppression)
  - Champs `attachmentUrl` / `attachmentName` ajoutés sur Revenue et Expense (Prisma)
  - Route API `/api/attachments/upload` (POST) — upload server-side vers Vercel Blob
  - Route API `/api/attachments` (DELETE) — suppression blob + reset DB
  - Icône trombone pour uploader, icône fichier/image pour voir, X pour supprimer
  - Validation : PDF/JPG/PNG/WebP, max 5 MB
  - Nettoyage blob automatique à la suppression d'un revenu ou frais
  - `next.config.ts` : `bodySizeLimit: "6mb"` pour les uploads
- Debug upload Vercel Blob : token explicite passé à `put()`, try/catch avec message d'erreur clair

## Fait — 17 mars 2026 (session 1)

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

## Fait — 15 mars 2026

- Système de facturation complet (devis, factures, avoirs)
- Gestion des clients avec formulaire inline
- Numérotation séquentielle (FAC-2026-XXX, DEV-2026-XXX, AV-2026-XXX)
- Conversion devis → facture
- Génération PDF pour tous les documents
- Vérification profil avant création de document
- Gestion des avoirs (notes de crédit) avec annulation de facture

## Fait — 14 mars 2026

- Setup initial : Next.js 16, Prisma 7, Better Auth, Tailwind v4
- Déploiement Vercel (neon Frankfurt)
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

## À faire — Priorité

- **Tester upload pièces jointes** : le store Blob est maintenant en mode privé avec proxy server-side, à vérifier en prod

## À faire — Roadmap

- Accès comptable (lecture seule)
- Stripe + plan Pro
- Rappels de déclaration URSSAF par email (quand nom de domaine ok)
- Envoi de factures par email (quand nom de domaine ok)
- Facturation électronique via Portail Public (2027)
