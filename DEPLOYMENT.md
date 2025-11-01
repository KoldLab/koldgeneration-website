# Guide de Déploiement

Ce guide vous aidera à déployer votre site web sur GitHub Pages en utilisant GitHub Actions.

## Prérequis

1. Un compte GitHub
2. Un dépôt pour votre site web (ce projet)

## Étapes pour Déployer

### 1. Code Déjà sur GitHub ✅

Votre code a été poussé sur la branche `main`. Vous êtes prêt !

### 2. Activer GitHub Pages

1. Allez sur votre dépôt GitHub : `https://github.com/KoldLab/koldgeneration-website`
2. Cliquez sur **Settings** → **Pages**
3. Sous "Source", sélectionnez **GitHub Actions** (PAS "Deploy from a branch")
4. Sauvegardez les paramètres

C'est tout ! GitHub Actions construira et déploiera automatiquement votre site.

## URL de Votre Site Web

Après le déploiement, votre site sera disponible à :

- **`https://koldlab.github.io/koldgeneration-website/`**

## Déploiement Automatique

Chaque fois que vous poussez vers la branche `main`, GitHub Actions va :

1. Construire votre site web
2. Le déployer sur GitHub Pages
3. Vos changements seront en ligne dans ~2 minutes

## Dépannage

### La Construction Échoue

- Vérifiez l'onglet **Actions** dans GitHub pour les logs d'erreur
- Assurez-vous que toutes les dépendances sont dans `package.json`

### Erreurs 404 sur les Routes

- C'est normal pour les SPAs (Single Page Applications)
- Le workflow de déploiement devrait gérer cela automatiquement
- Si vous voyez des 404s, vérifiez que la construction s'est terminée avec succès

## Test Local

Testez la construction de production localement avant de déployer :

```bash
npm run build
npm run preview
```

Visitez `http://localhost:4173` pour voir comment ça apparaîtra sur GitHub Pages.

## Notes

- Le workflow de déploiement est dans `.github/workflows/deploy.yml`
- La sortie de construction va dans le dossier `dist/` (gitignored)
- GitHub Pages sert automatiquement depuis la branche `gh-pages`
- Vous n'avez pas besoin d'un domaine personnalisé - le site fonctionne sur l'URL par défaut `github.io`

## Configuration Future d'un Domaine Personnalisé

Si vous voulez ajouter un domaine personnalisé plus tard :

1. Créez un fichier `public/CNAME` avec votre domaine
2. Dans GitHub Settings → Pages, ajoutez votre domaine personnalisé
3. Configurez les enregistrements DNS chez votre fournisseur de domaine

Mais pour l'instant, vous n'avez besoin de rien de tout ça ! Activez simplement GitHub Actions dans Settings et c'est fait. 🎉
