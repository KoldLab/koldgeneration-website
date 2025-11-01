# Deployment Guide

This guide will help you deploy your website to GitHub Pages using GitHub Actions.

## Prerequisites

1. A GitHub account
2. A repository for your website (this project)

## Steps to Deploy

### 1. Code is Already on GitHub ✅

Your code has been pushed to the `main` branch. You're all set!

### 2. Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/KoldLab/koldgeneration-website`
2. Click **Settings** → **Pages**
3. Under "Source", select **GitHub Actions** (NOT "Deploy from a branch")
4. Save the settings

That's it! GitHub Actions will automatically build and deploy your site.

## Your Website URL

After deployment, your site will be available at:
- **`https://koldlab.github.io/koldgeneration-website/`**

## Automatic Deployment

Every time you push to the `main` branch, GitHub Actions will:
1. Build your website
2. Deploy it to GitHub Pages
3. Your changes will be live in ~2 minutes

## Troubleshooting

### Build Fails

- Check the **Actions** tab in GitHub for error logs
- Make sure all dependencies are in `package.json`

### 404 Errors on Routes

- This is normal for SPAs (Single Page Applications)
- The deployment workflow should handle this automatically
- If you see 404s, check that the build completed successfully

## Local Testing

Test the production build locally before deploying:

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to see how it will look on GitHub Pages.

## Notes

- The deployment workflow is in `.github/workflows/deploy.yml`
- Build output goes to `dist/` folder (gitignored)
- GitHub Pages serves from the `gh-pages` branch automatically
- You don't need a custom domain - the site works on the default `github.io` URL

## Future Custom Domain Setup

If you want to add a custom domain later:
1. Create a `public/CNAME` file with your domain
2. In GitHub Settings → Pages, add your custom domain
3. Configure DNS records at your domain provider

But for now, you don't need any of that! Just enable GitHub Actions in Settings and you're done. 🎉