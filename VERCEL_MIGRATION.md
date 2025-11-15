# Migration Guide: Firebase Hosting → Vercel

This guide will help you migrate your frontend from Firebase Hosting to Vercel while keeping Firebase Auth & Firestore working.

## ✅ Prerequisites

- GitHub account (you already have this)
- Firebase project (you already have this)
- Vercel account (we'll create this)

## Step-by-Step Migration

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account

### Step 2: Deploy to Vercel

1. In Vercel dashboard, click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Find and select your `koldgeneration-website` repository
4. Click **"Import"**

### Step 3: Configure Project Settings

Vercel should auto-detect it's a Vite project. Verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add ALL your Firebase config variables:

**Required Firebase Variables:**
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=koldgeneration-website.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=koldgeneration-website
VITE_FIREBASE_STORAGE_BUCKET=koldgeneration-website.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Optional (if you have):**
```
VITE_EXERCISEDB_API_URL=https://your-api.vercel.app
```

💡 **Tip**: Make sure to add them for **Production**, **Preview**, and **Development** environments (or at least Production).

### Step 5: Deploy!

1. Click **"Deploy"** button
2. Wait 1-2 minutes for the build to complete
3. 🎉 Your app is now live on Vercel!

Your app will be available at:
- `https://koldgeneration-website-xxx.vercel.app` (or similar)
- You can customize the URL in Project Settings → Domains

### Step 6: Update Firebase Authorized Domains

Firebase Auth needs to know your Vercel domain is allowed:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **koldgeneration-website**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add your Vercel domain: `your-app-name.vercel.app`
6. (Optional) If you have a custom domain, add that too
7. Click **"Done"**

✅ Firebase Auth will now work from Vercel!

### Step 7: (Optional) Add Custom Domain

If you want to use `www.koldgeneration.com`:

1. In Vercel dashboard → Your Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `www.koldgeneration.com`
4. Follow the DNS configuration instructions:
   - Vercel will give you DNS records to add
   - Go to your domain registrar (where you bought the domain)
   - Add the DNS records Vercel provides
   - Wait 5-10 minutes for DNS to propagate
5. Vercel will automatically provision an SSL certificate
6. Once DNS is configured, your domain will be live! 🎉

**After custom domain is active:**
- Update Firebase Authorized Domains again with your custom domain
- Update any hardcoded URLs in your code/docs

### Step 8: Test Everything

1. ✅ Visit your Vercel URL
2. ✅ Test sign-in with Google (Firebase Auth)
3. ✅ Test any Firestore operations
4. ✅ Test all routes/navigation (SPA routing should work)
5. ✅ Test on mobile if possible

### Step 9: Update GitHub Actions (Optional)

If you want to keep both deployments temporarily (for backup):

- Keep the current GitHub Actions workflow (it will still deploy to Firebase)
- Vercel will auto-deploy on every push to `main` branch
- You'll have both versions running

If you want to remove Firebase Hosting:

1. Edit `.github/workflows/deploy.yml`
2. Comment out or remove the Firebase deployment steps
3. Keep Vercel as your primary deployment

### Step 10: Cleanup (When Ready)

Once you've confirmed everything works on Vercel:

1. You can disable Firebase Hosting (optional, keep it as backup)
2. Remove Firebase Hosting deployment from GitHub Actions
3. Your `firebase.json` file can stay (doesn't hurt anything)

## What Changes vs What Stays the Same

### ✅ Stays the Same:
- **Firebase Auth** - Works exactly the same
- **Firebase Firestore** - Works exactly the same
- **Your code** - Zero code changes needed
- **Environment variables** - Same variables, just added to Vercel
- **Local development** - `npm run dev` works the same

### 🔄 Changes:
- **Deployment platform** - Firebase Hosting → Vercel
- **Deployment URL** - New Vercel URL (or same custom domain)
- **Deployment workflow** - Auto-deploys on Git push (via Vercel)
- **Dashboard** - Use Vercel dashboard instead of Firebase Hosting dashboard

## Troubleshooting

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**: Make sure you added your Vercel domain to Firebase Authorized Domains (Step 6)

### Issue: Routes not working (404 errors)
**Solution**: The `vercel.json` file includes rewrite rules for SPA routing. If issues persist, check that the file is in your repo root.

### Issue: Environment variables not working
**Solution**: 
- Make sure variables start with `VITE_`
- Make sure they're added for the correct environment (Production/Preview/Development)
- Redeploy after adding variables

### Issue: Build fails on Vercel
**Solution**:
- Check build logs in Vercel dashboard
- Make sure `package.json` has all dependencies
- Check that build command is correct

## Benefits of Vercel

✅ **Preview Deployments** - Every PR gets a preview URL automatically  
✅ **Better Performance** - Optimized for React/Vite apps  
✅ **Analytics** - Built-in performance analytics  
✅ **Easy Rollback** - One-click rollback to previous deployments  
✅ **Custom Domains** - Easy SSL and domain management  
✅ **Environment Variables** - Easy management per environment  

## Next Steps

Once migrated to Vercel:
1. Deploy ExerciseDB API to Vercel (separate project)
2. Start building the Workout Journal feature
3. Enjoy unified deployment workflow!

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- Check build logs in Vercel dashboard for specific errors

