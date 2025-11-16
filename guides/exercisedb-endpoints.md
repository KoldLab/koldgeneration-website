# ExerciseDB API Endpoints Reference

Based on the [ExerciseDB v1 documentation](https://v1.exercisedb.dev/docs), here are the correct endpoints:

## Base URL

```
https://kold-exercisedb-api.vercel.app
```

## Endpoints (Try These in Order)

### 1. Root/Health Check

```
GET /
```

Should return API info or available endpoints.

### 2. All Exercises

Try these patterns:

**Pattern 1** (Most likely based on docs):

```
GET /exercises
```

**Pattern 2** (If API uses /api prefix):

```
GET /api/exercises
```

**Pattern 3** (If API uses versioning):

```
GET /api/v1/exercises
GET /api/v2/exercises
```

**Pattern 4** (If version in path):

```
GET /v1/exercises
GET /v2/exercises
```

### 3. Get Exercise by ID

```
GET /exercises/:id
GET /api/exercises/:id
GET /api/v1/exercises/:id
```

Example:

```
GET /exercises/K6NnTv0
```

### 4. Filter by Body Part

```
GET /exercises/bodyPart/{bodyPart}
GET /api/exercises/bodyPart/{bodyPart}
GET /api/v1/exercises/bodyPart/{bodyPart}
```

Examples:

```
GET /exercises/bodyPart/Chest
GET /exercises/bodyPart/Back
GET /exercises/bodyPart/Arms
```

### 5. Filter by Equipment

```
GET /exercises/equipment/{equipment}
GET /api/exercises/equipment/{equipment}
GET /api/v1/exercises/equipment/{equipment}
```

Examples:

```
GET /exercises/equipment/Barbell
GET /exercises/equipment/Dumbbell
GET /exercises/equipment/Bodyweight
```

### 6. Filter by Target Muscle

```
GET /exercises/target/{target}
GET /api/exercises/target/{target}
GET /api/v1/exercises/target/{target}
```

### 7. Search by Name

```
GET /exercises/name/{name}
GET /api/exercises/name/{name}
GET /api/v1/exercises/name/{name}
```

## Quick Browser Tests

Try these URLs directly in your browser:

1. **Root endpoint:**

   ```
   https://kold-exercisedb-api.vercel.app/
   ```

2. **All exercises (try in order):**

   ```
   https://kold-exercisedb-api.vercel.app/exercises
   https://kold-exercisedb-api.vercel.app/api/exercises
   https://kold-exercisedb-api.vercel.app/api/v1/exercises
   https://kold-exercisedb-api.vercel.app/v1/exercises
   ```

3. **Specific exercise:**

   ```
   https://kold-exercisedb-api.vercel.app/exercises/K6NnTv0
   ```

4. **Filter by body part:**

   ```
   https://kold-exercisedb-api.vercel.app/exercises/bodyPart/Chest
   ```

5. **Filter by equipment:**
   ```
   https://kold-exercisedb-api.vercel.app/exercises/equipment/Barbell
   ```

## Check the Repository

Since you forked the repository, you can check:

1. **Route files** in the repository:
   - Look in `api/` folder
   - Look in `src/` folder
   - Look for `routes.ts`, `index.ts`, or `server.ts`

2. **Configuration files:**
   - `vercel.json` - might have rewrite rules
   - `package.json` - might have scripts showing structure
   - `next.config.js` or `vite.config.js` - might have API routes

3. **README.md** in the forked repository:
   - Should have endpoint documentation
   - Example requests
   - Usage instructions

## Use Browser Console

Open browser DevTools (F12) → Console tab, then try:

```javascript
// Test root endpoint
fetch('https://kold-exercisedb-api.vercel.app/')
  .then((r) => r.json())
  .then((d) => console.log('Root:', d))
  .catch((e) => console.error('Root error:', e));

// Test /exercises
fetch('https://kold-exercisedb-api.vercel.app/exercises')
  .then((r) => r.json())
  .then((d) => console.log('Exercises:', d))
  .catch((e) => console.error('Exercises error:', e));

// Test /api/exercises
fetch('https://kold-exercisedb-api.vercel.app/api/exercises')
  .then((r) => r.json())
  .then((d) => console.log('API Exercises:', d))
  .catch((e) => console.error('API Exercises error:', e));

// Test /api/v1/exercises
fetch('https://kold-exercisedb-api.vercel.app/api/v1/exercises')
  .then((r) => r.json())
  .then((d) => console.log('V1 Exercises:', d))
  .catch((e) => console.error('V1 Exercises error:', e));
```

## Check Vercel Function Logs

1. Go to Vercel Dashboard → Your `exercisedb-api` project
2. Click on a deployment
3. Go to **Functions** tab
4. Check which functions are deployed
5. This will show you the actual route structure

## Expected Response Format

When an endpoint works, you should see JSON like:

```json
{
  "data": [
    {
      "exerciseId": "K6NnTv0",
      "name": "Bench Press",
      "bodyParts": ["Chest"],
      "equipments": ["Barbell"],
      "targetMuscles": ["Pectoralis Major"],
      ...
    }
  ]
}
```

Or:

```json
[
  {
    "exerciseId": "K6NnTv0",
    "name": "Bench Press",
    ...
  }
]
```

## Once You Find the Working Endpoint

1. Note the exact pattern (e.g., `/api/v1/exercises`)
2. Update your environment variable: `VITE_EXERCISEDB_API_URL`
3. Use this base URL in your `exerciseDBService.ts` file
4. Build your workout journal feature!
