# GitHub Actions Deployment Setup

Automated deployment to Firebase Hosting when you push to GitHub.

## Step 1: Get Firebase Service Account Key

1. Open https://console.firebase.google.com/
2. Select project: **koldgeneration-website**
3. Click ⚙️ (gear icon) → **Project Settings**
4. Click the **Service accounts** tab
5. Click **Generate new private key** button
6. Click **Generate key** in the popup
7. A JSON file downloads — open it and copy all the text inside

## Step 2: Add Secrets to GitHub

1. Open your repository: https://github.com/KoldLab/koldgeneration-website
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**

### Add these 7 secrets (one at a time):

**Secret 1:**

- **Name:** `FIREBASE_SERVICE_ACCOUNT`
- **Value:** Paste the entire JSON file you copied from Step 1 (all on one line is fine)

**Secret 2:**

- **Name:** `VITE_FIREBASE_API_KEY`
- **Value:** Copy from your `.env` file (the value after `=`)

**Secret 3:**

- **Name:** `VITE_FIREBASE_AUTH_DOMAIN`
- **Value:** `koldgeneration-website.firebaseapp.com`

**Secret 4:**

- **Name:** `VITE_FIREBASE_PROJECT_ID`
- **Value:** `koldgeneration-website`

**Secret 5:**

- **Name:** `VITE_FIREBASE_STORAGE_BUCKET`
- **Value:** `koldgeneration-website.appspot.com`

**Secret 6:**

- **Name:** `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value:** Copy from your `.env` file

**Secret 7:**

- **Name:** `VITE_FIREBASE_APP_ID`
- **Value:** Copy from your `.env` file

## Step 3: Commit and Push the Workflow

Run these commands:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add automatic deployment"
git push origin main
```

## Step 4: Verify It Works

1. Go to: https://github.com/KoldLab/koldgeneration-website/actions
2. You should see a workflow running (yellow dot)
3. Wait 2-3 minutes for it to complete (green checkmark = success)
4. Your site will be automatically deployed!

## What Happens Next

**Every time you push to `main`:**

- GitHub automatically builds your site
- Deploys it to Firebase Hosting
- Your site updates in 2-3 minutes

**You can still:**

- Keep your `.env` file for local development
- Use `npm run deploy:firebase` for manual deployments if needed

## Troubleshooting

**"Workflow failed" → Check the Actions tab:**

- Red X = Error (click to see details)
- Usually means a secret is missing or wrong

**"Firebase authentication error"**

- Make sure `FIREBASE_SERVICE_ACCOUNT` has the complete JSON content

**"Missing Firebase config"**

- Check all 6 `VITE_FIREBASE_*` secrets are added
