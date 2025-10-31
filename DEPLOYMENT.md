# Deployment Guide

This guide will help you deploy your website to GitHub Pages with a custom domain.

## Prerequisites

1. A GitHub account
2. A repository for your website (this project)
3. A custom domain (you mentioned you already have one)

## Steps to Deploy

### 1. Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **GitHub Actions**
4. Save the settings

### 3. Configure Custom Domain

Your domains: **koldgeneration.com** and **koldgeneration.ca**

1. The CNAME file is already set to `koldgeneration.com` (primary domain)
2. Commit and push:
   ```bash
   git add public/CNAME
   git commit -m "Add custom domain"
   git push origin main
   ```
3. In GitHub: Go to **Settings** → **Pages** → scroll down to "Custom domain"
4. Enter `koldgeneration.com` and click **Save**

### 4. Configure DNS

**Important:** Your domain is on Squarespace. You need to configure DNS records to point your domains to GitHub Pages. Squarespace and GitHub Pages can work together - Squarespace manages your domain, and GitHub hosts your website.

#### For koldgeneration.com

**Apex Domain** (`@` or blank):

- Type: `A`
- Value: `185.199.108.153`
- Value: `185.199.109.153`
- Value: `185.199.110.153`
- Value: `185.199.111.153`
- TTL: `3600`

**www Subdomain**:

- Type: `CNAME`
- Name: `www`
- Value: `koldlab.github.io`
- TTL: `3600`

#### For koldgeneration.ca

**Same setup as above** - add the same A records and CNAME for www subdomain.

**Note:** You can point `.ca` to the same GitHub Pages site by using the same IPs.

#### How to Add DNS Records in Squarespace:

1. Log in to your Squarespace account
2. Go to **Settings** → **Domains** (or **Website** → **Domains**)
3. Find your domain (koldgeneration.com or koldgeneration.ca)
4. Click **DNS Settings** or **Manage DNS Records**
5. Look for **Advanced DNS** or **Custom DNS Records**
6. Add the A records:
   - Click **Add Record** → Type: `A`
   - For each IP address, add a separate A record:
     - Host: `@` (or leave blank/empty for the root domain)
     - Points to: `185.199.108.153`
   - Repeat for all four IPs (separate record for each)
7. Add the CNAME record:
   - Click **Add Record** → Type: `CNAME`
   - Host: `www`
   - Points to: `koldlab.github.io`
8. **Repeat steps 3-7 for koldgeneration.ca** (if you have it connected)

**Wait 5-30 minutes** for DNS propagation.

**Note:** Some Squarespace plans only show DNS settings if the domain is connected to your site. If you don't see DNS settings, you may need to:
- Disconnect the domain from any Squarespace website
- Or contact Squarespace support to enable custom DNS records

**Alternative:** If Squarespace DNS management is too complex, you can transfer your domain DNS to a provider like Cloudflare (free) or Google Domains, which have simpler DNS management interfaces. This won't change domain ownership, just DNS management.

### 5. Enable HTTPS (Optional but Recommended)

1. Go to **Settings** → **Pages**
2. Under "Custom domain", check **Enforce HTTPS**
3. Wait for the certificate to be issued (usually a few minutes)

## Automatic Deployment

Every time you push to the `main` branch, GitHub Actions will:

1. Build your website
2. Deploy it to GitHub Pages
3. Your changes will be live in ~2 minutes

## Troubleshooting

### Build Fails

- Check the **Actions** tab in GitHub for error logs
- Make sure all dependencies are in `package.json`

### Domain Not Working

- Verify DNS records are correct (use `nslookup` or `dig` commands)
- Wait longer for DNS propagation (can take up to 48 hours)
- Check that CNAME file is correct

### 404 Errors on Routes

- Make sure paths in your code are relative (they should be)
- Vite should handle SPA routing automatically

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
- Your custom domain is set in `public/CNAME`
- GitHub Pages serves from the `gh-pages` branch automatically
