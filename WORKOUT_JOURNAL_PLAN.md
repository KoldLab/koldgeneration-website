                                                                    # Workout Journal Feature - Implementation Plan

## Overview

A comprehensive workout journal system where users can log workouts, save routines, manage exercises, and track their fitness history.

## ExerciseDB API Integration

**Decision: Integrate ExerciseDB API** ([GitHub](https://github.com/ExerciseDB/exercisedb-api))

### Why ExerciseDB Makes Sense:

1. **5,000+ Pre-built Exercises** - No need for users to manually create common exercises
2. **Rich Metadata** - Each exercise includes:
   - Images and videos for visual guidance
   - Target muscle groups
   - Required equipment
   - Step-by-step instructions
   - Exercise tips and variations
   - Related exercises
3. **Self-Hostable** - Can deploy on Vercel for full control
4. **Open Source (AGPL-3.0)** - Free to use and modify
5. **Developer-Friendly** - REST API with good documentation

### Integration Approach:

- **Hybrid Model**: Users can:
  - **Import from ExerciseDB** - Browse and add exercises from the database
  - **Create Custom Exercises** - Still have the ability to create their own
  - **Enhanced Exercise Data** - When importing, automatically get images, videos, instructions, etc.

### Implementation Details:

- Create an `exerciseDBService.ts` to interact with self-hosted ExerciseDB API
- Add an "Import from ExerciseDB" button in Exercise Library
- Search/filter interface to browse ExerciseDB exercises
- When importing, store ExerciseDB exercise ID and metadata
- Display images/videos in exercise details
- Show instructions and tips when logging workouts

## Navigation Structure

- Add "Workouts" menu item before "Tournaments" in the navigation
- Location: `src/routesConfig.ts` (insert before tournaments section)

## Data Models

### Exercise (Base Exercise Library)

```typescript
interface Exercise {
  id: string;
  userId: string; // Owner of the exercise (user-specific library)
  name: string;
  description?: string;
  // ExerciseDB integration fields (optional)
  exerciseDBId?: string; // Reference to ExerciseDB exercise ID
  source: 'custom' | 'exercisedb'; // Source of the exercise
  // ExerciseDB metadata (optional, stored when imported)
  imageUrl?: string;
  videoUrl?: string;
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string[];
  bodyParts?: string[];
  instructions?: string[];
  exerciseTips?: string[];
  variations?: string[];
  relatedExerciseIds?: string[];
  keywords?: string[];
  overview?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Exercise Entry (Exercise within a Workout)

```typescript
interface ExerciseEntry {
  exerciseId: string; // Reference to Exercise
  exerciseName: string; // Snapshot of name at time of logging
  sets: ExerciseSet[];
  notes?: string; // Comments for this exercise in this workout
}

interface ExerciseSet {
  setNumber: number;
  reps?: number;
  weight?: number; // "charge" in user's terms
  completed: boolean;
  notes?: string; // Optional per-set comments
}
```

### Workout Routine (Template)

```typescript
interface WorkoutRoutine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  exercises: ExerciseEntry[]; // Without set data (template)
  createdAt: Date;
  updatedAt: Date;
}
```

### Workout Log (Completed Workout)

```typescript
interface WorkoutLog {
  id: string;
  userId: string;
  routineId?: string; // Optional: if started from a routine
  routineName?: string; // Snapshot of routine name
  date: Date;
  exercises: ExerciseEntry[]; // With complete set data
  notes?: string; // Overall workout notes
  duration?: number; // Duration in minutes (optional)
  createdAt: Date;
  updatedAt: Date;
}
```

## Firestore Collections Structure

```
workouts/
  - exercises/{exerciseId}
    - userId: string
    - name: string
    - description?: string
    - createdAt: Timestamp
    - updatedAt: Timestamp

  - routines/{routineId}
    - userId: string
    - name: string
    - description?: string
    - exercises: ExerciseEntry[]
    - createdAt: Timestamp
    - updatedAt: Timestamp

  - logs/{logId}
    - userId: string
    - routineId?: string
    - routineName?: string
    - date: Timestamp
    - exercises: ExerciseEntry[]
    - notes?: string
    - duration?: number
    - createdAt: Timestamp
    - updatedAt: Timestamp
```

## File Structure

```
src/
├── types/
│   └── workout.ts              # All TypeScript interfaces/types
├── services/
│   ├── workoutService.ts       # Firestore CRUD operations
│   └── exerciseDBService.ts    # ExerciseDB API integration
├── components/
│   └── pages/
│       └── workouts/
│           ├── Workouts.tsx                    # Main workouts page (list view)
│           ├── ExerciseLibrary.tsx             # Manage exercises
│           ├── ExerciseDBBrowser.tsx           # Browse/import from ExerciseDB
│           ├── WorkoutRoutines.tsx             # Manage routines
│           ├── WorkoutHistory.tsx              # View past workouts
│           ├── LogWorkout.tsx                  # Log a new workout
│           ├── CreateEditExercise.tsx          # Create/edit exercise dialog
│           ├── CreateEditRoutine.tsx           # Create/edit routine dialog
│           ├── WorkoutLogView.tsx              # View detailed workout log
│           └── components/
│               ├── ExerciseEntryForm.tsx       # Exercise entry with sets
│               ├── SetInput.tsx                # Individual set input
│               ├── ExerciseSelector.tsx        # Exercise picker component
│               └── WorkoutLogCard.tsx          # Workout log card component
└── routes.tsx                                  # Add workout routes
```

## Routes

```
/workouts                          # Main workouts page (protected)
  - Shows tabs/sections:
    - Log Workout (default)
    - History
    - Routines
    - Exercise Library

/workouts/log                      # Log a new workout (can be embedded in main page)
/workouts/history                  # Workout history list
/workouts/history/:logId           # View detailed workout log
/workouts/routines                 # Manage routines
/workouts/exercises                # Manage exercise library
```

## Feature Breakdown

### 1. Exercise Library Management

**Page:** `ExerciseLibrary.tsx`

- List all saved exercises for the user
- Create new exercise (name + optional description)
- **Import from ExerciseDB** - Browse and import exercises from database
- Edit existing exercises
- Delete exercises (with confirmation)
- Search/filter exercises (local + ExerciseDB search)
- Each exercise shows:
  - Name
  - Description (if available)
  - Source badge (Custom / ExerciseDB)
  - Image thumbnail (if from ExerciseDB)
  - Target muscles (if from ExerciseDB)
  - Equipment (if from ExerciseDB)
  - Created date
  - Last used date (optional enhancement)
- Click to view full details (with images/videos if available)

**Components Needed:**

- `CreateEditExercise.tsx` - Dialog/form for creating/editing exercises
- `ExerciseDBBrowser.tsx` - Browse/search ExerciseDB and import exercises
- `ExerciseDetailsDialog.tsx` - View full exercise details with images/videos

### 2. Workout Routine Management

**Page:** `WorkoutRoutines.tsx`

- List all saved routines
- Create new routine:
  - Name + optional description
  - Add exercises from library
  - For each exercise in routine:
    - Set number of sets (template)
    - Optional default reps/weight
  - Save routine
- Edit routine
- Delete routine (with confirmation)
- Load routine to start a workout

**Components Needed:**

- `CreateEditRoutine.tsx` - Dialog/form for creating/editing routines
- `ExerciseSelector.tsx` - Component to select from exercise library

### 3. Log Workout

**Page:** `LogWorkout.tsx`
**Options:**

- Start from scratch (empty workout)
- Start from a routine (pre-fill exercises)
- Continue previous workout (if in progress)

**Workout Logging Flow:**

1. Select or add exercises
2. For each exercise:
   - Display exercise name (and description if available)
   - Add sets with:
     - Set number (auto-increment)
     - Reps (optional)
     - Weight/charge (optional)
     - Notes (optional per set)
     - Mark as completed
   - Overall exercise notes (optional)
3. Add overall workout notes (optional)
4. Track duration (optional - auto or manual)
5. Save workout log

**Components Needed:**

- `ExerciseEntryForm.tsx` - Manages sets for one exercise
- `SetInput.tsx` - Individual set input row
- `ExerciseSelector.tsx` - Add exercises to workout

### 4. Workout History

**Page:** `WorkoutHistory.tsx`

- List all past workouts (most recent first)
- Filter by date range
- Filter by routine (if applicable)
- Search workouts
- Each workout card shows:
  - Date
  - Duration (if available)
  - Number of exercises
  - Routine name (if started from routine)
  - Preview of exercises
- Click to view full details

**Page:** `WorkoutLogView.tsx`

- Full workout details:
  - Date, duration, routine info
  - All exercises with sets:
    - Exercise name
    - Each set: reps, weight, completed status
    - Exercise notes
  - Overall workout notes
- Edit workout (optional - allow modifications)
- Delete workout (with confirmation)

**Components Needed:**

- `WorkoutLogCard.tsx` - Card component for history list

### 5. Main Workouts Page

**Page:** `Workouts.tsx`

- Tabbed or sectioned interface:
  - **Log Workout** (default)
  - **History**
  - **Routines**
  - **Exercise Library**
- Quick stats (optional):
  - Total workouts logged
  - Most recent workout date
  - Favorite routines

## Service Layer

### `workoutService.ts`

Functions needed:

### `exerciseDBService.ts`

**ExerciseDB API Functions:**

- `searchExercises(query: string, filters?): Promise<ExerciseDBExercise[]>`
- `getExerciseById(exerciseId: string): Promise<ExerciseDBExercise>`
- `getExercisesByBodyPart(bodyPart: string): Promise<ExerciseDBExercise[]>`
- `getExercisesByEquipment(equipment: string): Promise<ExerciseDBExercise[]>`
- `getExercisesByTargetMuscle(muscle: string): Promise<ExerciseDBExercise[]>`

**ExerciseDB Exercise Type (from API):**

```typescript
interface ExerciseDBExercise {
  exerciseId: string;
  name: string;
  imageUrl?: string;
  videoUrl?: string;
  equipments?: string[];
  bodyParts?: string[];
  exerciseType?: string;
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  videoUrl?: string;
  keywords?: string[];
  overview?: string;
  instructions?: string[];
  exerciseTips?: string[];
  variations?: string[];
  relatedExerciseIds?: string[];
}
```

### `workoutService.ts`

Functions needed:

**Exercises:**

- `createExercise(userId, exerciseData): Promise<Exercise>`
- `getExercisesByUserId(userId): Promise<Exercise[]>`
- `updateExercise(exerciseId, updates): Promise<void>`
- `deleteExercise(exerciseId): Promise<void>`
- `importExerciseFromDB(userId, exerciseDBId): Promise<Exercise>` - Import from ExerciseDB

**Routines:**

- `createRoutine(userId, routineData): Promise<WorkoutRoutine>`
- `getRoutinesByUserId(userId): Promise<WorkoutRoutine[]>`
- `getRoutineById(routineId): Promise<WorkoutRoutine | null>`
- `updateRoutine(routineId, updates): Promise<void>`
- `deleteRoutine(routineId): Promise<void>`

**Workout Logs:**

- `createWorkoutLog(userId, logData): Promise<WorkoutLog>`
- `getWorkoutLogsByUserId(userId, filters?): Promise<WorkoutLog[]>`
- `getWorkoutLogById(logId): Promise<WorkoutLog | null>`
- `updateWorkoutLog(logId, updates): Promise<void>`
- `deleteWorkoutLog(logId): Promise<void>`

## UI/UX Considerations

### Design Patterns (Following existing patterns):

- Use shadcn/ui components (Card, Button, Dialog, Input, etc.)
- Protected routes (require authentication)
- Loading states with Loader2 icon
- Error handling with retry buttons
- Confirmation dialogs for destructive actions
- Responsive design (mobile-friendly)
- Dark mode support (via existing theme system)

### User Experience:

- Quick-add buttons for common actions
- Drag-and-drop to reorder exercises (optional enhancement)
- Keyboard shortcuts (optional enhancement)
- Auto-save draft workouts (optional enhancement)
- Copy previous workout as template (optional enhancement)

## Translation Keys Needed

Add to `src/i18n/locales/en.json` (and `fr.json`):

```json
{
  "workouts": {
    "title": "Workouts",
    "description": "Track your fitness journey with workout logging and routines",
    "log": {
      "title": "Log Workout",
      "description": "Record a new workout session"
    },
    "history": {
      "title": "Workout History",
      "description": "View your past workout sessions"
    },
    "routines": {
      "title": "Routines",
      "description": "Manage your workout routines"
    },
    "exercises": {
      "title": "Exercise Library",
      "description": "Manage your exercise library"
    },
    "exerciseDB": {
      "title": "Exercise Database",
      "browse": "Browse Exercise Database",
      "import": "Import Exercise",
      "search": "Search exercises...",
      "filterByBodyPart": "Filter by Body Part",
      "filterByEquipment": "Filter by Equipment",
      "filterByMuscle": "Filter by Target Muscle",
      "noResults": "No exercises found",
      "importSuccess": "Exercise imported successfully",
      "viewDetails": "View Details",
      "instructions": "Instructions",
      "tips": "Tips",
      "variations": "Variations",
      "targetMuscles": "Target Muscles",
      "secondaryMuscles": "Secondary Muscles",
      "equipment": "Equipment",
      "relatedExercises": "Related Exercises"
    },
    "exercise": {
      "name": "Exercise Name",
      "description": "Description",
      "sets": "Sets",
      "reps": "Reps",
      "weight": "Weight",
      "charge": "Weight/Charge",
      "notes": "Notes",
      "addSet": "Add Set",
      "removeSet": "Remove Set",
      "completed": "Completed",
      "overallNotes": "Exercise Notes"
    },
    "routine": {
      "name": "Routine Name",
      "description": "Description",
      "addExercise": "Add Exercise",
      "saveRoutine": "Save Routine",
      "loadRoutine": "Load Routine"
    },
    "log": {
      "date": "Date",
      "duration": "Duration (minutes)",
      "overallNotes": "Workout Notes",
      "saveWorkout": "Save Workout",
      "startFromScratch": "Start from Scratch",
      "startFromRoutine": "Start from Routine"
    }
  }
}
```

## Implementation Steps

### Phase 1: Foundation

1. ✅ Create plan document (this file)
2. Add routes to `routes.tsx`
3. Add navigation item to `routesConfig.ts`
4. Add translation keys
5. Create TypeScript types in `src/types/workout.ts`
6. Set up ExerciseDB API service (self-host or configure endpoint)
7. Create `exerciseDBService.ts` with API integration functions

### Phase 2: Exercise Library

6. Create `workoutService.ts` with exercise CRUD functions
7. Create `exerciseDBService.ts` with ExerciseDB API integration
8. Create `ExerciseLibrary.tsx` page
9. Create `CreateEditExercise.tsx` component
10. Create `ExerciseDBBrowser.tsx` component (browse/import from ExerciseDB)
11. Create `ExerciseDetailsDialog.tsx` component (show images/videos)
12. Test exercise management and ExerciseDB integration

### Phase 3: Routines

13. Add routine CRUD functions to `workoutService.ts`
14. Create `WorkoutRoutines.tsx` page
15. Create `CreateEditRoutine.tsx` component
16. Create `ExerciseSelector.tsx` component (include ExerciseDB search)
17. Test routine management

### Phase 4: Logging Workouts

18. Add workout log CRUD functions to `workoutService.ts`
19. Create `LogWorkout.tsx` page
20. Create `ExerciseEntryForm.tsx` component (show instructions/videos if available)
21. Create `SetInput.tsx` component
22. Test workout logging with ExerciseDB exercises

### Phase 5: History

23. Create `WorkoutHistory.tsx` page
24. Create `WorkoutLogView.tsx` page (show exercise images/instructions)
25. Create `WorkoutLogCard.tsx` component
26. Test history viewing

### Phase 6: Main Page & Polish

27. Create main `Workouts.tsx` page with tabs/sections
28. Connect all pages together
29. Add loading states and error handling
30. Test complete flow (including ExerciseDB integration)
31. Polish UI/UX
32. Configure ExerciseDB API endpoint (environment variable)

## ExerciseDB API Setup

### License Information (AGPL-3.0):

✅ **You are authorized to use ExerciseDB API** - The AGPL-3.0 license allows you to:

- Use the code for your project
- Self-host the API
- Modify and deploy it

⚠️ **Important**: If you modify the ExerciseDB API source code, you must make those changes public under AGPL-3.0. If you only use it as-is (no code changes), this requirement doesn't affect your main application.

### Deployment Options:

#### Option 1: **Self-Host on Firebase Functions** ⚡ (Recommended if you want everything in one place)

**Pros:**

- ✅ **Unified Platform** - Everything in Firebase (same billing, monitoring, project)
- ✅ **Already using Firebase** - No new platform to learn
- ✅ **Same Authentication** - Can use Firebase Auth tokens if needed
- ✅ **Firebase Hosting Integration** - Can proxy API calls through your domain
- ✅ **Free Tier Available** - Firebase Functions free tier (2M invocations/month)

**Cons:**

- ⚠️ **Code Restructuring Required** - ExerciseDB API needs to be adapted to Firebase Functions structure
- ⚠️ **Cold Starts** - Functions may have slower first requests (especially on free tier)
- ⚠️ **More Complex Setup** - Need to set up Functions project structure
- ⚠️ **Deployment Process** - More manual than Vercel's one-click

**Setup Steps:**

1. Fork [ExerciseDB API repo](https://github.com/ExerciseDB/exercisedb-api)
2. Restructure code for Firebase Functions (convert API routes to function handlers)
3. Create `functions` directory in your Firebase project
4. Deploy with `firebase deploy --only functions`
5. API URL will be: `https://us-central1-koldgeneration-website.cloudfunctions.net/api`

#### Option 2: **Self-Host on Vercel** (Recommended for easiest setup)

**Pros:**

- ✅ **One-Click Deploy** - ExerciseDB API is already optimized for Vercel
- ✅ **Zero Code Changes** - Works out of the box
- ✅ **Better API Performance** - Optimized for serverless APIs, faster cold starts
- ✅ **Easy to Use** - Very simple deployment process
- ✅ **Free Tier** - Very generous free tier

**Cons:**

- ⚠️ **Separate Platform** - Different billing/monitoring from Firebase
- ⚠️ **Two Places to Manage** - Firebase for main app, Vercel for API

**Setup Steps:**

1. Fork [ExerciseDB API repo](https://github.com/ExerciseDB/exercisedb-api)
2. Connect repo to Vercel (one-click deploy button available)
3. Get API endpoint URL
4. Add to environment variables: `VITE_EXERCISEDB_API_URL`

#### Option 3: **Use Official API** (Development/Testing Only)

- Use the playground endpoints for testing
- **Note**: Not recommended for production due to rate limits

### **Decision: ✅ Using Vercel for Everything!**

**Great idea!** Deploying both your **frontend AND the ExerciseDB API on Vercel** is an excellent choice.

#### **What Changes:**

- ✅ **Frontend**: Move from Firebase Hosting → Vercel
- ✅ **ExerciseDB API**: Deploy on Vercel
- ✅ **Firebase Services**: Keep using Firebase Auth & Firestore (they work from any domain!)

#### **Why This Works:**

- **Firebase Auth & Firestore are SERVICES** (not hosting) - they work from any domain
- **Firebase Hosting** is just static hosting - Vercel does this better
- **One unified platform** - everything in Vercel
- **Better developer experience** - one dashboard, one deployment process
- **Learning Vercel comprehensively** - frontend + backend + API

#### **Benefits:**

- ✅ Everything in one place (Vercel dashboard)
- ✅ Same deployment workflow for frontend and API
- ✅ Better performance for React/Vite apps
- ✅ Preview deployments for every PR
- ✅ Still use Firebase for Auth/Firestore (best of both worlds!)
- ✅ One platform to learn and master

### Configuration & Migration:

#### **Step 1: Deploy ExerciseDB API to Vercel**

1. Go to [ExerciseDB API GitHub](https://github.com/ExerciseDB/exercisedb-api)
2. Click "Fork" to create your own copy
3. Go to [vercel.com](https://vercel.com) and sign up (free with GitHub)
4. Click "Add New Project" → "Import Git Repository"
5. Select your forked ExerciseDB repo
6. Click "Deploy" (Vercel auto-detects the configuration)
7. Wait 1-2 minutes for deployment
8. Copy the deployment URL (e.g., `https://exercisedb-api-xxx.vercel.app`)
9. Done! 🎉 Your ExerciseDB API is live!

#### **Step 2: Deploy Frontend to Vercel**

1. In Vercel dashboard, click "Add New Project"
2. Import your main repo (`koldgeneration-website`)
3. Vercel will auto-detect it's a Vite project
4. Add environment variables:
   - All your `VITE_FIREBASE_*` variables (for Auth/Firestore)
   - `VITE_EXERCISEDB_API_URL` (the API URL from Step 1)
5. Click "Deploy"
6. Your frontend is now on Vercel! 🎉

#### **Step 3: Update Firebase Authorized Domains**

1. Go to Firebase Console → Authentication → Settings
2. Add your new Vercel domain to "Authorized domains"
   - Your Vercel URL: `your-app.vercel.app`
   - Custom domain (if you add one later)
3. Firebase Auth will now work from Vercel!

#### **Step 4: (Optional) Add Custom Domain**

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain (`www.koldgeneration.com`)
3. Update DNS records (Vercel will guide you)
4. SSL certificate auto-provisioned!

#### **What Stays the Same:**

- ✅ Firebase Auth - works exactly the same (just add Vercel domain)
- ✅ Firebase Firestore - works exactly the same
- ✅ All your code - zero changes needed
- ✅ Environment variables - same variables, just add Vercel

#### **What Gets Better:**

- ✅ Unified platform - everything in Vercel
- ✅ Preview deployments - test PRs before merging
- ✅ Better performance - optimized for React/Vite
- ✅ One deployment workflow
- ✅ Better analytics and monitoring

#### **Migration Notes:**

- You can keep Firebase Hosting active during migration (test on Vercel first)
- Once Vercel works, you can disable Firebase Hosting
- Firebase Auth/Firestore continue working regardless of hosting platform

### API Endpoints (Expected):

- `GET /exercises` - List/search exercises
- `GET /exercises/:id` - Get exercise by ID
- `GET /exercises/bodyPart/:bodyPart` - Filter by body part
- `GET /exercises/equipment/:equipment` - Filter by equipment
- `GET /exercises/target/:muscle` - Filter by target muscle

## Additional Enhancements (Future)

- Statistics/analytics (progress charts, PR tracking)
- Workout templates (pre-made routines)
- ~~Exercise images/videos~~ ✅ **Integrated via ExerciseDB**
- Social features (share workouts)
- Export data (CSV/PDF)
- Mobile app (if needed)
- Timer integration with existing timer tool
- Body measurements tracking
- Goals and targets
- Progress tracking with ExerciseDB exercise IDs (track PRs per exercise)
