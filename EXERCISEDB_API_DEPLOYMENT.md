# ExerciseDB API Deployment Guide

This guide will help you deploy the ExerciseDB API to Vercel so you can use it in your Workout Journal feature.

## Step-by-Step Deployment

### Step 1: Fork the ExerciseDB API Repository

1. Go to [ExerciseDB API GitHub](https://github.com/ExerciseDB/exercisedb-api)
2. Click the **"Fork"** button (top right)
3. Choose where to fork it (usually your personal account or KoldLab organization)
4. Wait for the fork to complete (takes ~30 seconds)

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. You should see your forked `exercisedb-api` repository
   - If you don't see it, click **"Adjust GitHub App Permissions"** and grant access
5. Select the `exercisedb-api` repository
6. Click **"Import"**

### Step 3: Configure Project Settings

Vercel should auto-detect the configuration. Verify these settings:

- **Framework Preset**: Should auto-detect (probably Next.js or Node.js)
- **Root Directory**: `./` (leave as default)
- **Build Command**: Leave as default (Vercel will auto-detect)
- **Output Directory**: Leave as default
- **Install Command**: `npm install` or `bun install` (check the repo)

**Note**: The ExerciseDB API might use Bun. If build fails, check the repo's README for build instructions.

### Step 4: Environment Variables (if needed)

Check if the ExerciseDB API needs any environment variables:
- Usually, it should work out of the box
- If the repo mentions environment variables, add them here
- For now, you can skip this and add them later if needed

### Step 5: Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for the build to complete
3. You'll see build logs in real-time
4. Once complete, you'll see **"Ready"** status

### Step 6: Get Your API URL

1. After deployment, you'll see your project dashboard
2. Look for the **"Production"** deployment
3. Copy the URL (e.g., `https://exercisedb-api-xxx.vercel.app`)
4. This is your ExerciseDB API endpoint!

### Step 7: Test the API

Test that your API is working:

1. Open a new browser tab
2. Visit: `https://your-api-url.vercel.app/exercises` (or check the API docs for the correct endpoint)
3. You should see exercise data or a JSON response

**Example test URLs** (check the ExerciseDB API docs for actual endpoints):
- `https://your-api-url.vercel.app/exercises`
- `https://your-api-url.vercel.app/api/exercises`
- Check the repository's README or API documentation

### Step 8: Add API URL to Your Main Project

1. Go to your main project in Vercel (`koldgeneration-website`)
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `VITE_EXERCISEDB_API_URL`
   - **Value**: `https://your-exercisedb-api-url.vercel.app`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **"Save"**
5. **Redeploy** your main project (Vercel will use the new env variable)

Or add it locally to your `.env` file:
```
VITE_EXERCISEDB_API_URL=https://your-exercisedb-api-url.vercel.app
```

## Project Structure in Vercel

After deployment, you'll have:

```
Vercel Dashboard:
├── koldgeneration-website (your main app)
└── exercisedb-api (the exercise database API)
```

## Troubleshooting

### Issue: Build fails
**Solution**: 
- Check build logs in Vercel
- The ExerciseDB API might use Bun instead of npm
- Update Build Command if needed (check repo's README)

### Issue: API returns 404
**Solution**:
- Check the API documentation for correct endpoints
- Make sure you're using the right base URL
- Some APIs use `/api` prefix, others don't

### Issue: CORS errors when calling from frontend
**Solution**:
- The ExerciseDB API should handle CORS
- If not, you might need to modify the API code (since you forked it)
- Or use Vercel's serverless functions as a proxy

### Issue: API is slow
**Solution**:
- First request might be slow (cold start)
- Subsequent requests should be fast
- This is normal for serverless functions

## Next Steps

Once your API is deployed:

1. ✅ Test the API endpoints
2. ✅ Add API URL to your main project's environment variables
3. ✅ Create `exerciseDBService.ts` in your main project
4. ✅ Start building the Workout Journal integration!

## API Documentation

Check the ExerciseDB API repository for:
- Available endpoints
- Request/response formats
- Query parameters
- Filtering options

Common endpoints (check the actual API docs):
- `GET /exercises` - List all exercises
- `GET /exercises/:id` - Get exercise by ID
- `GET /exercises/bodyPart/:bodyPart` - Filter by body part
- `GET /exercises/equipment/:equipment` - Filter by equipment
- `GET /exercises/target/:muscle` - Filter by target muscle

## Note on Updates

Since you forked the repository:
- You can update it by syncing with the original repo
- Or keep your own modifications
- Vercel will auto-deploy on every push to your fork

