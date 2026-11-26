# Menu3D — plateforme de menus de restaurants en 3D et réalité augmentée

Chaque restaurant crée son menu ; chaque plat peut être **scanné en 3D**. Le client scanne le
QR code posé sur sa table, voit le menu et **pose le plat en 3D sur sa table** avec la caméra
de son téléphone (comme « Voir dans votre pièce » sur Amazon), puis commande.

## Parcours

| Qui | Où | Quoi |
|---|---|---|
| Gérant | `/inscription` | Demande de création de compte + restaurant (statut *en attente*) |
| Super-admin | `/superadmin` | **Demandes** (valider / refuser), **Restaurants** (abonnement, restrictions, suspension, « Gérer » avec l’interface du gérant), **Paiements** à vérifier, **Paramètres** (prix, essai, délai de grâce, RIB) |
| Gérant validé | `/admin/dashboard` | Plats (photos, temps de préparation, ingrédients, allergènes, prix, tailles, suppléments, **3D**), collections, tables + QR codes, commandes, finances, fiche restaurant, **abonnement** |
| Client | `/r/<restaurant>?table=7` | Menu, fiche plat, vue 3D, **AR sur la table**, commande à la table |
| Client | `/scan` | Scanner de QR code intégré (sinon l’appareil photo du téléphone suffit) |

À la validation, le gérant reçoit son **lien d’accès** (`/admin/login?email=…`, e-mail pré-rempli) :
par e-mail automatique si Resend est configuré, sinon l’admin l’envoie en un clic par WhatsApp, e-mail ou copier-coller.

Connexion unique sur `/admin/login` : le super-admin (variables `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
est envoyé sur `/superadmin`, les gérants sur `/admin/dashboard`. Un gérant en attente, refusé ou
suspendu voit un message clair et ne peut rien modifier (vérifié à chaque requête, même avec une
session déjà ouverte).

## Abonnements

- 3 offres (prix modifiables dans Paramètres) : **Essentiel** (40 plats, 5 en 3D), **Pro** (illimité, studio 3D),
  **Premium** (+ scan 3D automatique). 12 mois = 2 mois offerts.
- À la validation : essai gratuit (14 jours par défaut) sur l’offre choisie dans Paramètres.
- Le gérant voit ses jours restants, renouvelle depuis l’onglet **Abonnement** (virement / espèces… + justificatif) ;
  l’admin valide le paiement → l’abonnement est prolongé depuis la date de fin en cours.
- Alerte 7 jours avant l’échéance, puis **délai de grâce** (5 jours) ; ensuite le menu public est hors ligne et
  le menu ne peut plus être modifié (les commandes restent consultables) jusqu’au renouvellement.
- L’admin peut aussi prolonger à la main (+7 j, +1/3/12 mois, montant encaissé), changer l’offre, terminer l’essai,
  et **restreindre** un gérant : lecture seule, commandes désactivées, 3D désactivée, nombre max de plats, message.

## Les plats en 3D

Dans la fiche d’un plat, section **« Plat en 3D & réalité augmentée »**, trois façons d’obtenir le modèle :

1. **Scanner le plat avec la caméra** (studio de capture guidée) : le gérant fait le tour du plat
   en 3 hauteurs ; un anneau montre les angles déjà photographiés (boussole du téléphone quand
   elle est disponible), mode rafale automatique. Les photos sont envoyées à la reconstruction
   3D automatique si `MESHY_API_KEY` est configurée (API *multi-image to 3D* de Meshy).
2. **Importer un scan `.glb` / `.usdz`** réalisé avec une appli de photogrammétrie (Polycam,
   KIRI Engine, Scaniverse, Reality Composer / Object Capture sur iPhone…). C’est la meilleure
   qualité. Les gros fichiers sont envoyés en morceaux de 3,5 Mo (compatible Vercel) et stockés
   dans MongoDB GridFS.
3. **Aperçu 3D instantané depuis la photo** : génère dans le navigateur une assiette en porcelaine
   à taille réelle avec la photo du plat (three.js), pour que chaque plat soit visible en AR tout de suite.

**Studio 3D** (bouton sur chaque plat qui a un modèle) : aperçu temps réel (three.js) de ce que fera le serveur —
mise à niveau (rotations 90° + inclinaison fine), **taille réelle par la largeur ou la hauteur**, **suppression de la
table et du décor** (cylindre de recadrage + coupe sous la surface), qualité (léger / équilibré / ultra). Le serveur
retraite toujours le **modèle original** (non destructif) puis une vignette est rendue pour un affichage instantané.

**Pipeline serveur** (`src/lib/model-pipeline.js`, glTF-Transform + meshoptimizer + sharp), appliqué à tout modèle :
transformations « cuites » dans les sommets, centrage, base posée à y = 0, mise à l’échelle réelle, recadrage,
soudure/dédoublonnage, simplification (≤ 200k triangles), textures redimensionnées (≤ 2048 px, JPEG).

**Scan automatique** (offre Premium) : avec `KIRI_API_KEY`, les photos de la capture guidée partent en
**photogrammétrie** (20–300 photos, détourage automatique, textures 4K) ; sinon Meshy (IA, 4 photos).
La capture guidée signale les photos **floues, sombres ou surexposées**.

**Côté client** : éclairage studio, ombre douce, caméra bridée au-dessus de la table, bouton **Dimensions**
(cotes L × P × H en cm comme sur une fiche produit) et **« Voir sur ma table »** en taille réelle.

**Taille réelle** : le diamètre réel de l’assiette (cm) est saisi par le gérant. Les modèles IA et
les aperçus sont mis à l’échelle *dans le fichier GLB* côté serveur (`src/lib/glb.js`), posés à
y = 0 ; un scan importé dans une mauvaise unité est corrigé automatiquement. Ainsi le plat a la
même taille dans la page, dans Scene Viewer (Android) et dans Quick Look (iPhone).

**Côté client** : `<model-viewer>` (Google) — rotation/zoom dans la page, bouton
**« Voir sur ma table »** qui ouvre WebXR / Scene Viewer sur Android et Quick Look sur iPhone
(le fichier USDZ est généré à la volée si aucun n’est fourni). L’AR nécessite HTTPS.

## Sécurité

- Toutes les routes de gestion exigent un gérant validé et sont **filtrées par restaurant**
  (un gérant ne peut ni lire ni modifier les données d’un autre).
- Les prix des commandes sont **recalculés côté serveur** (plat, taille, suppléments).
- Le menu public n’expose que les restaurants validés et les champs utiles du modèle 3D.

## Installation

```bash
cp .env.example .env.local   # puis remplir les valeurs
npm install
npm run dev
```

### Migration depuis la version mono-restaurant

Les plats, collections, tables, commandes et dépenses existants n’ont pas de restaurant.
1. Créez le compte du restaurant via `/inscription`, validez-le dans `/superadmin`.
2. Dans `/superadmin`, encart **« Données de l’ancienne version »** : cliquez sur le restaurant
   pour lui rattacher toutes les anciennes données (les index uniques deviennent « par restaurant »).
3. Pour que les QR codes déjà imprimés (`/?table=N`) continuent de marcher, renseignez
   `DEFAULT_RESTAURANT_SLUG` avec l’adresse du restaurant (`/r/<slug>`), puis réimprimez les
   nouveaux QR depuis l’onglet **Tables**.
