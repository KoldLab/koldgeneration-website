# Guide de Déploiement

Ce guide vous aidera à déployer votre site web sur GitHub Pages avec votre domaine personnalisé.

## Prérequis

1. Un compte GitHub
2. Un dépôt pour votre site web (ce projet)
3. Un domaine personnalisé configuré (www.koldgeneration.com)

## Configuration GitHub Pages

### 1. Activer GitHub Pages

1. Allez sur votre dépôt GitHub : `https://github.com/KoldLab/koldgeneration-website`
2. Cliquez sur **Settings** → **Pages** (dans la barre latérale gauche)
3. Sous "Source", sélectionnez **"Deploy from a branch"**
4. Choisissez la branche **`main`** et le dossier **`/docs`**
5. Sauvegardez les paramètres

### 2. Configuration du Domaine Personnalisé

1. Le fichier `public/CNAME` contient déjà votre domaine : `www.koldgeneration.com`
2. Dans GitHub Settings → Pages, ajoutez votre domaine personnalisé si ce n'est pas déjà fait
3. Configurez les enregistrements DNS chez votre fournisseur de domaine :
   - Type: `CNAME`
   - Name: `www`
   - Value: `KoldLab.github.io`

## Déploiement

### Déploiement Automatique (Recommandé)

Pour déployer votre site en une seule commande :

```bash
npm run deploy
```

Cette commande va automatiquement :

1. Construire le site dans le dossier `docs/` (`npm run build`)
2. Ajouter les fichiers au commit (`git add docs`)
3. Commiter les changements
4. Pousser vers la branche `main`

### Déploiement Manuel

Si vous préférez déployer manuellement :

1. Construisez le site localement :

   ```bash
   npm run build
   ```

2. Ajoutez et commitez le dossier `docs/` :

   ```bash
   git add docs
   git commit -m "Deploy to production"
   git push origin main
   ```

## URL de Votre Site Web

Votre site est disponible à :

- **`https://www.koldgeneration.com`**

## Test Local

Testez la construction de production localement avant de déployer :

```bash
npm run build
npm run preview
```

Visitez `http://localhost:4173` pour voir comment ça apparaîtra en production.

## Dépannage

### La Construction Échoue

- Assurez-vous que toutes les dépendances sont dans `package.json`
- Vérifiez que TypeScript compile sans erreurs : `npm run build`

### Erreurs 404 sur les Routes

- Le fichier `public/404.html` gère automatiquement le routage pour les SPAs
- Si vous voyez des 404s, vérifiez que le fichier `404.html` est bien présent dans le dossier `dist/`

### Problèmes de SSL/HTTPS

- GitHub Pages configure automatiquement SSL pour les domaines personnalisés
- L'activation peut prendre quelques heures après la configuration DNS
- Vérifiez le statut dans GitHub Settings → Pages

## Notes

- La sortie de construction va dans le dossier `docs/` (committé dans git)
- Le fichier `public/CNAME` est automatiquement copié dans `docs/` lors de la construction
- Le site est servi directement depuis le dossier `/docs` de la branche `main`
- Le domaine personnalisé `www.koldgeneration.com` est configuré dans `public/CNAME`
- GitHub Pages est configuré pour servir depuis le dossier `/docs`
