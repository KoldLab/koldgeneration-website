# Workout Journal Dashboard - Implementation Plan

## Overview

A comprehensive dashboard for the workout journal where users can:
- View past workouts in a calendar or list view
- See multiple workouts per day
- Easily start a new workout
- Get quick stats and insights

## Dashboard Features

### 1. Main Dashboard View (`/workouts`)

**Primary Components:**
- **Header Section** with title and stats
- **View Toggle** (Calendar/List view)
- **New Workout Button** (prominently placed)
- **Workout History Display** (calendar or list)
- **Quick Stats Card** (optional)

### 2. View Options

#### Calendar View (Default)
- Monthly calendar with workout indicators
- Dates with workouts show visual indicators (dot/badge)
- Click date to see workouts for that day
- Days with multiple workouts show count badge
- Current day highlighted

#### List View (Alternative)
- Reverse chronological list (newest first)
- Grouped by date
- Each date can show multiple workout entries
- Compact cards with essential info
- Infinite scroll or pagination

### 3. Multiple Workouts Per Day Support

**Data Structure:**
- Workout logs already support this via `WorkoutLog` interface
- Each workout has its own `date` field
- Multiple workouts can have the same date
- Display should group by date and show all workouts

**UI Design:**
- Calendar: Show count badge (e.g., "3") on days with multiple workouts
- List: Show all workouts under same date header
- Each workout card clearly separated
- Option to add time labels (e.g., "Morning", "Evening") if logged

### 4. New Workout Button Placement

**Option 1: Floating Action Button (Mobile-first)**
- Fixed position bottom-right
- Rounded button with "+" icon
- Always visible, doesn't scroll away
- Good for mobile and tablet

**Option 2: Header Button (Desktop-friendly)**
- Top-right of dashboard header
- Primary button style
- Icon + text: "New Workout" or just icon on mobile

**Option 3: Both (Recommended)**
- Header button for desktop
- Floating button for mobile
- Same action, responsive design

## Component Structure

```
src/components/pages/workouts/
├── WorkoutDashboard.tsx          # Main dashboard page
├── components/
│   ├── WorkoutCalendar.tsx       # Calendar view component
│   ├── WorkoutListView.tsx       # List view component
│   ├── WorkoutDateGroup.tsx      # Groups workouts by date
│   ├── WorkoutCard.tsx           # Individual workout card
│   ├── NewWorkoutButton.tsx      # New workout button (responsive)
│   ├── QuickStats.tsx            # Stats summary card
│   └── ViewToggle.tsx            # Switch between calendar/list
```

## Data Flow

### Service Layer (`workoutService.ts`)

**Functions Needed:**
```typescript
// Get workouts grouped by date
getWorkoutsGroupedByDate(userId: string, startDate?: Date, endDate?: Date): Promise<Map<string, WorkoutLog[]>>

// Get workouts for a specific date
getWorkoutsByDate(userId: string, date: Date): Promise<WorkoutLog[]>

// Get workouts in date range
getWorkoutsInRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutLog[]>

// Get workout statistics
getWorkoutStats(userId: string, startDate?: Date, endDate?: Date): Promise<WorkoutStats>
```

**WorkoutStats Interface:**
```typescript
interface WorkoutStats {
  totalWorkouts: number;
  totalDays: number; // Days with at least one workout
  averagePerWeek: number;
  longestStreak: number; // Consecutive days
  currentStreak: number;
  lastWorkoutDate?: Date;
  mostUsedRoutine?: {
    routineId: string;
    routineName: string;
    count: number;
  };
}
```

## UI/UX Design

### Design Principles
- **Simple and Clean**: Follow existing design patterns
- **Mobile-First**: Responsive design, works on all screen sizes
- **Fast**: Lazy loading, pagination for large datasets
- **Clear**: Easy to see when workouts occurred
- **Actionable**: Prominent "New Workout" button

### Calendar View Design
- Use shadcn/ui Calendar component if available
- Or build custom calendar using existing components
- Month navigation (prev/next)
- Today button to jump to current month
- Workout indicators:
  - Small colored dot for single workout
  - Badge with count for multiple workouts
  - Different colors could indicate routine types (future enhancement)

### List View Design
- Date headers (e.g., "Monday, January 15, 2024")
- Workout cards below each date
- Each card shows:
  - Time (if available) or order indicator
  - Routine name (if started from routine)
  - Exercise count
  - Duration (if available)
  - Quick actions (view, edit, delete)

### Workout Card Content
**Essential Info:**
- Date and time (if available)
- Routine name (if applicable)
- Number of exercises
- Total sets
- Duration (if tracked)
- Quick preview of exercises (first 2-3)

**Actions:**
- View full details
- Edit (if recent)
- Delete (with confirmation)

### New Workout Button States
- Default: Primary color, "+ New Workout"
- Hover: Slightly elevated
- Mobile: Icon only or smaller text
- Loading: Disabled while navigating

## Routing

```
/workouts (protected)
  └── Default: Dashboard (calendar view)
  └── Query params:
      ?view=list (list view)
      ?view=calendar (calendar view)
      ?date=2024-01-15 (focus specific date)
```

## State Management

### Dashboard State
- Current view (calendar/list)
- Selected date (for calendar)
- Workouts data (cached)
- Loading states
- Filter options (date range, routine, etc.)

### Data Fetching Strategy
- Load current month's workouts initially
- Load adjacent months on navigation
- Cache loaded months
- Refresh on return to dashboard
- Optimistic updates when creating new workouts

## Implementation Steps

### Phase 1: Foundation
1. ✅ Create plan document
2. Create `workoutService.ts` with Firestore functions
3. Add route for `/workouts` dashboard
4. Create base `WorkoutDashboard.tsx` component
5. Add navigation link to routes

### Phase 2: Service Layer
6. Implement `getWorkoutsByUserId()` 
7. Implement `getWorkoutsByDate()`
8. Implement `getWorkoutsInRange()`
9. Implement `getWorkoutsGroupedByDate()`
10. Implement `getWorkoutStats()` (optional for Phase 1)

### Phase 3: List View (Start Simple)
11. Create `WorkoutListView.tsx`
12. Create `WorkoutDateGroup.tsx`
13. Create `WorkoutCard.tsx`
14. Implement date grouping logic
15. Add loading and empty states

### Phase 4: Calendar View
16. Check if shadcn/ui calendar component exists
17. If not, add it: `npx shadcn@latest add calendar`
18. Create `WorkoutCalendar.tsx`
19. Implement workout indicators
20. Implement date click handlers
21. Add month navigation

### Phase 5: New Workout Button
22. Create `NewWorkoutButton.tsx` component
23. Implement responsive design (header + floating)
24. Add navigation to log workout page
25. Style consistently with existing buttons

### Phase 6: Polish & Enhancements
26. Add `ViewToggle.tsx` for switching views
27. Implement URL query params for view state
28. Add `QuickStats.tsx` component (optional)
29. Add empty states ("No workouts yet")
30. Add error handling and retry
31. Optimize performance (memoization, lazy loading)

## shadcn/ui Components Needed

### Already Available (based on codebase):
- ✅ Button
- ✅ Card
- ✅ Dialog
- ✅ Badge (likely)

### May Need to Add:
- Calendar (`npx shadcn@latest add calendar`)
- Popover (for date click actions)
- Tabs (optional, for view switching)

### Check Components:
```bash
# Check if calendar exists
ls components/ui/calendar.tsx

# If not, add it
npx shadcn@latest add calendar
```

## Translation Keys

Add to `src/i18n/locales/en.json` (and `fr.json`):

```json
{
  "workouts": {
    "dashboard": {
      "title": "Workout Journal",
      "description": "Track and view your workout history",
      "newWorkout": "New Workout",
      "noWorkouts": "No workouts yet. Start your first workout!",
      "loading": "Loading workouts...",
      "error": "Failed to load workouts",
      "retry": "Retry"
    },
    "calendar": {
      "title": "Calendar View",
      "workoutCount": "{{count}} workout",
      "workoutCount_plural": "{{count}} workouts",
      "selectDate": "Select a date to view workouts",
      "today": "Today",
      "noWorkoutsOnDate": "No workouts on this date"
    },
    "list": {
      "title": "List View",
      "recent": "Recent Workouts",
      "groupedBy": "Workouts on {{date}}"
    },
    "stats": {
      "totalWorkouts": "Total Workouts",
      "totalDays": "Days Active",
      "currentStreak": "Current Streak",
      "lastWorkout": "Last Workout"
    }
  }
}
```

## Firestore Queries

### Get Workouts by User
```typescript
query(
  collection(db, 'workouts/logs'),
  where('userId', '==', userId),
  orderBy('date', 'desc'),
  orderBy('createdAt', 'desc')
)
```

### Get Workouts by Date Range
```typescript
query(
  collection(db, 'workouts/logs'),
  where('userId', '==', userId),
  where('date', '>=', startDate),
  where('date', '<=', endDate),
  orderBy('date', 'desc')
)
```

### Get Workouts for Specific Date
- Need to query by date range (start of day to end of day)
- Or use timestamp and filter in memory
- Firestore doesn't support exact date queries easily

**Solution:**
```typescript
const startOfDay = new Date(date);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(date);
endOfDay.setHours(23, 59, 59, 999);

query(
  collection(db, 'workouts/logs'),
  where('userId', '==', userId),
  where('date', '>=', startOfDay),
  where('date', '<=', endOfDay),
  orderBy('date', 'desc')
)
```

## Future Enhancements (Post-MVP)

1. **Statistics Dashboard**
   - Progress charts
   - Weekly/monthly summaries
   - Personal records tracking
   - Exercise volume over time

2. **Filters & Search**
   - Filter by routine
   - Filter by date range
   - Search workout notes
   - Filter by exercise

3. **Quick Actions**
   - Duplicate previous workout
   - Start from template
   - Quick edit from dashboard

4. **Export & Share**
   - Export workout data (CSV/JSON)
   - Share workout summary
   - Print workout log

5. **Notifications**
   - Remind to log workout
   - Streak reminders
   - Goal progress updates

## Notes

- Keep design consistent with existing tournament pages
- Use existing Card, Button components
- Follow same loading/error patterns as ExerciseLibrary
- Consider performance for users with many workouts
- Mobile-first responsive design
- Support dark mode (via existing theme system)
