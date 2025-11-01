# Firebase Hosting Setup Guide

This guide will help you deploy your SPA to Firebase Hosting instead of GitHub Pages.

## Prerequisites

1. A Google account
2. Node.js and npm installed

## Setup Steps

### 1. Login to Firebase

```bash
npm run firebase:login
```

This will open your browser to authenticate with Firebase.

### 2. Initialize Firebase Project

```bash
npm run firebase:init
```

When prompted:
- **Select "Hosting"** (use arrow keys and spacebar to select)
- **Select "Use an existing project"** or **"Create a new project"**
  - If creating new: Enter a project name (e.g., `koldgeneration-website`)
- **What do you want to use as your public directory?** → Enter `dist`
- **Configure as a single-page app?** → **Yes**
- **Set up automatic builds and deploys with GitHub?** → **No** (unless you want CI/CD)

### 3. Update .firebaserc

The `.firebaserc` file will be automatically created/updated with your project ID.

### 4. Configure Custom Domain (Optional)

If you want to use `www.koldgeneration.com`:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Hosting** → **Add custom domain**
4. Enter `www.koldgeneration.com`
5. Follow the DNS configuration instructions:
   - Add the A record provided by Firebase to your DNS provider
6. Wait for SSL certificate provisioning (usually 5-10 minutes)

### 5. Deploy to Firebase

```bash
npm run deploy:firebase
```

This will:
1. Build your site (`npm run build`)
2. Deploy to Firebase Hosting

Your site will be live at:
- Firebase URL: `https://your-project-id.web.app` or `https://your-project-id.firebaseapp.com`
- Custom domain: `https://www.koldgeneration.com` (once configured)

## Benefits of Firebase Hosting

✅ **Native SPA Support** - No need for `404.html` workarounds  
✅ **Automatic Routing** - All routes automatically rewrite to `index.html`  
✅ **Global CDN** - Fast loading worldwide  
✅ **Free SSL/HTTPS** - Automatic SSL certificates  
✅ **Easy Deployment** - One command to deploy  
✅ **Custom Domains** - Easy setup with DNS verification  

## Deployment Commands

- **Deploy to Firebase**: `npm run deploy:firebase`
- **Deploy to GitHub Pages** (if still using): `npm run deploy`

## Notes

- The `firebase.json` is already configured for your `dist/` folder
- The rewrite rules ensure all routes work correctly (no 404 issues!)
- You can keep both deployment methods - just use the command you prefer

