# Setting Up dev.koldgeneration.com

This guide will help you set up a development environment at `dev.koldgeneration.com` using Firebase Hosting preview channels.

## Overview

You'll have:

- **Production**: `www.koldgeneration.com` (or your main domain) - deploys from `main` branch
- **Development**: `dev.koldgeneration.com` - deploys from `develop` or `dev` branch

**Note**: Firebase preview channels create temporary URLs (like `dev--koldgeneration-website.web.app`), but you can also attach a custom domain (`dev.koldgeneration.com`) to make it permanent and easier to access.

## Step 0: Test Locally First (Optional)

Before setting up the custom domain, you can test the preview channel deployment locally:

1. Build your site:

   ```bash
   npm run build
   ```

2. Deploy to a preview channel locally:

   ```bash
   firebase hosting:channel:deploy dev
   ```

3. Firebase will provide you with a temporary URL like:
   - `dev--koldgeneration-website.web.app`
   - `dev--koldgeneration-website.firebaseapp.com`

4. Visit this URL to verify your build works correctly before setting up the custom domain.

**Tip**: You can use this command anytime to quickly preview changes on the `dev` channel without pushing to GitHub.

## Step 1: Create a Dev Branch

If you don't already have a `develop` or `dev` branch:

```bash
git checkout -b develop
git push -u origin develop
```

The workflow is configured to deploy from both `develop` and `dev` branches. Use whichever you prefer.

## Step 2: Deploy to Firebase Preview Channel

The GitHub Actions workflow (`.github/workflows/deploy-dev.yml`) will automatically:

1. Deploy to Firebase preview channel `dev` when you push to `develop` or `dev` branch
2. Build the site with the same Firebase configuration as production

After pushing to the dev branch, the workflow will run and create/update the `dev` preview channel.

**Important**: After the first deployment, your `dev` channel will be accessible via a temporary URL like:

- `https://dev--koldgeneration-website.web.app`
- `https://dev--koldgeneration-website.firebaseapp.com`

You can use this temporary URL immediately to test your deployment, even before setting up the custom domain. The custom domain (`dev.koldgeneration.com`) is optional but makes it easier to remember and share.

## Step 3: Set Up Custom Domain in Firebase Console

**Note**: At this point, your `dev` channel already has a temporary URL (like `dev--koldgeneration-website.web.app`). We're now adding a custom domain so you can access it via `dev.koldgeneration.com` instead.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **koldgeneration-website**
3. Go to **Hosting** in the left sidebar
4. You should see your preview channels listed (including `dev`)
5. Click on the **`dev`** channel
6. You'll see the channel details, including its temporary URL
7. Click **"Add custom domain"** or **"Manage custom domains"**
8. Enter: `dev.koldgeneration.com`
9. Click **Continue**

After setup, both URLs will work:

- Temporary URL: `dev--koldgeneration-website.web.app` (always available)
- Custom domain: `dev.koldgeneration.com` (once DNS is configured)

## Step 4: Configure DNS Records

Firebase will provide you with DNS records to add. You'll need to add these to your domain registrar (where you manage `koldgeneration.com`):

### Option 1: A Record (Recommended)

Add an **A record**:

- **Type**: `A`
- **Name**: `dev`
- **Value**: (The IP address provided by Firebase - usually `151.101.1.195`, `151.101.65.195`, `151.101.129.195`, `151.101.193.195`)
- **TTL**: `3600` (or default)

**Note**: Firebase may provide multiple A records. Add all of them.

### Option 2: CNAME Record (Alternative)

If Firebase provides a CNAME option:

- **Type**: `CNAME`
- **Name**: `dev`
- **Value**: (The CNAME target provided by Firebase)
- **TTL**: `3600` (or default)

## Step 5: Verify DNS Configuration

After adding the DNS records:

1. Wait for DNS propagation (can take a few minutes to 48 hours, usually 5-15 minutes)
2. You can check DNS propagation using tools like:
   - https://dnschecker.org/
   - https://www.whatsmydns.net/
3. In Firebase Console, the domain status should change from "Pending" to "Connected" once DNS is verified

## Step 6: SSL Certificate Provisioning

Firebase will automatically provision an SSL certificate for `dev.koldgeneration.com`. This usually takes 5-10 minutes after DNS is verified.

You can check the status in Firebase Console → Hosting → Custom domains.

## Step 7: Test the Deployment

1. Make a change in your `develop` branch
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Test dev deployment"
   git push origin develop
   ```
3. Wait for the GitHub Actions workflow to complete (check Actions tab)
4. Visit `https://dev.koldgeneration.com` - your changes should be live!

## Workflow Summary

**Production Deployment:**

- Push to `main` branch → Deploys to `live` channel → `www.koldgeneration.com`

**Development Deployment:**

- Push to `develop` or `dev` branch → Deploys to `dev` channel → `dev.koldgeneration.com`

## Manual Deployment

If you need to manually trigger the dev deployment:

1. Go to GitHub → Your repository
2. Click **Actions** tab
3. Select **"Deploy to Dev Environment"** workflow
4. Click **"Run workflow"** button
5. Select the branch and click **"Run workflow"**

## Troubleshooting

### DNS Not Resolving

- **Wait longer**: DNS propagation can take up to 48 hours (usually much faster)
- **Check DNS records**: Make sure you added the correct records at your domain registrar
- **Verify domain**: Use `nslookup dev.koldgeneration.com` or `dig dev.koldgeneration.com` to check

### Firebase Shows "DNS Not Verified"

- Double-check the DNS records are correct
- Make sure you're adding records for the root domain (`koldgeneration.com`), not just the subdomain
- Wait for DNS propagation

### SSL Certificate Issues

- Wait 10-15 minutes after DNS is verified
- Firebase automatically provisions SSL - no manual action needed
- Check Firebase Console → Hosting → Custom domains for status

### Workflow Fails

- Check GitHub Actions → Workflow run → See error details
- Ensure all secrets are configured (same as production)
- Verify `FIREBASE_SERVICE_ACCOUNT` secret is correct

## Notes

- Both environments use the **same Firebase project** (`koldgeneration-website`)
- The dev environment uses the **same Firebase config** (Firestore, Auth, etc.)
- Consider using **separate Firebase projects** if you want completely isolated dev data
- Preview channels are perfect for testing before merging to `main`

## Alternative: Separate Firebase Project for Dev

If you want completely separate Firebase resources (separate Firestore database, Auth users, etc.):

1. Create a new Firebase project: `koldgeneration-website-dev`
2. Update the workflow to use the new project ID
3. Set up separate environment variables/secrets for dev
4. Configure Firebase in your code to use different projects based on environment

This is more complex but provides true isolation between dev and production.
