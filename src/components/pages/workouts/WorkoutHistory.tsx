import * as React from 'react';
import { format, startOfMonth, getYear } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkoutStore } from '@/stores/workoutStore';
import { toast } from 'sonner';
import {
  getWorkoutLogsByUserId,
  deleteWorkoutLog,
  createRoutine,
  getExerciseById,
} from '@/services/workoutService';
import {
  getExerciseById as getExerciseDBById,
  getAllExercises,
} from '@/services/exerciseDBService';
import { useExerciseCacheStore } from '@/stores/exerciseCacheStore';
import type {
  WorkoutLog,
  WorkoutRoutine,
  ExerciseDBExercise,
} from '@/types/workout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Loader2,
  Dumbbell,
  Play,
  Save,
  Info,
  Trash2,
} from 'lucide-react';
import ExerciseDetailsDialog from './components/ExerciseDetailsDialog';

type WorkoutByMonth = {
  year: number;
  month: number;
  monthName: string;
  workouts: WorkoutLog[];
};

const WORKOUTS_TAB_STORAGE_KEY = 'workouts-active-tab';

export default function WorkoutHistory() {
  const { t, i18n } = useTranslation();

  // Get date-fns locale based on current language
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const { user } = useAuth();
  const { setWorkoutEntries, setSelectedRoutineId, clearWorkout } =
    useWorkoutStore();
  const [workouts, setWorkouts] = React.useState<WorkoutLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedWorkout, setSelectedWorkout] =
    React.useState<WorkoutLog | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = React.useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedExerciseForDetails, setSelectedExerciseForDetails] =
    React.useState<{
      exercise: WorkoutLog['exercises'][0];
      workout: WorkoutLog;
    } | null>(null);
  const [exerciseDBDetails, setExerciseDBDetails] =
    React.useState<ExerciseDBExercise | null>(null);
  const [loadingExerciseDetails, setLoadingExerciseDetails] =
    React.useState(false);
  const [expandedExercises, setExpandedExercises] = React.useState<Set<string>>(
    new Set()
  );
  const [isSaveRoutineDialogOpen, setIsSaveRoutineDialogOpen] =
    React.useState(false);
  const [routineNameInput, setRoutineNameInput] = React.useState('');
  const [savingRoutine, setSavingRoutine] = React.useState(false);
  const [workoutToDelete, setWorkoutToDelete] =
    React.useState<WorkoutLog | null>(null);
  const { getExercise: getCachedExercise, setExercise: cacheExercise } =
    useExerciseCacheStore();

  React.useEffect(() => {
    if (!user) return;

    const loadWorkouts = async () => {
      setLoading(true);
      try {
        const logs = await getWorkoutLogsByUserId(user.uid);
        setWorkouts(logs);
      } catch (err: any) {
        toast.error(err.message || t('workouts.history.error'));
        console.error('Failed to load workouts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, [user, t]);

  const workoutsByMonth = React.useMemo(() => {
    const grouped: Record<string, WorkoutByMonth> = {};

    workouts.forEach((workout) => {
      const year = getYear(workout.date);
      const month = startOfMonth(workout.date).getMonth();
      const key = `${year}-${month}`;
      const monthNameRaw = format(workout.date, 'MMMM', {
        locale: i18n.language === 'fr' ? fr : enUS,
      });
      // Capitalize first letter
      const monthName =
        monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);

      if (!grouped[key]) {
        grouped[key] = {
          year,
          month,
          monthName,
          workouts: [],
        };
      }

      grouped[key].workouts.push(workout);
    });

    // Sort workouts within each month (newest first)
    Object.values(grouped).forEach((group) => {
      group.workouts.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    // Convert to array and sort by year/month (newest first)
    return Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [workouts, i18n.language]);

  const handleStartWorkout = (workout: WorkoutLog) => {
    // Convert workout log exercises to workout entries (without set data)
    const entries = workout.exercises.map((ex) => ({
      ...(ex.exerciseId && { exerciseId: ex.exerciseId }),
      ...(ex.exerciseDBId && { exerciseDBId: ex.exerciseDBId }),
      exerciseName: ex.exerciseName,
      sets: [], // Start with empty sets
      notes: ex.notes,
    }));

    // Clear current workout and set new entries
    clearWorkout();
    setWorkoutEntries(entries);
    setSelectedRoutineId('none'); // Not from a routine, from a workout log

    // Switch to log tab
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKOUTS_TAB_STORAGE_KEY, 'log');
      // Trigger a custom event to notify Workouts component
      window.dispatchEvent(
        new CustomEvent('workout-tab-change', { detail: 'log' })
      );
    }

    setIsActionDialogOpen(false);
    toast.success(t('workouts.history.workoutLoaded'));
  };

  const handleSaveAsRoutineClick = (workout: WorkoutLog) => {
    setSelectedWorkout(workout);
    setRoutineNameInput(
      workout.routineName || workout.date.toLocaleDateString()
    );
    setIsSaveRoutineDialogOpen(true);
  };

  const handleSaveAsRoutine = async () => {
    if (!user || !selectedWorkout) return;

    const routineName = routineNameInput.trim();
    if (!routineName) {
      toast.error(t('workouts.routines.nameRequired'));
      return;
    }

    setSavingRoutine(true);
    try {
      const routineData: Omit<
        WorkoutRoutine,
        'id' | 'userId' | 'createdAt' | 'updatedAt'
      > = {
        name: routineName,
        description: selectedWorkout.notes || '',
        exercises: selectedWorkout.exercises.map((ex) => ({
          ...(ex.exerciseId && { exerciseId: ex.exerciseId }),
          ...(ex.exerciseDBId && { exerciseDBId: ex.exerciseDBId }),
          exerciseName: ex.exerciseName,
          sets: ex.sets.map((set) => ({
            ...set,
            completed: false, // Reset completion status for routine
          })),
          notes: ex.notes,
        })),
      };

      await createRoutine(user.uid, routineData);
      toast.success(t('workouts.history.savedAsRoutine'));
      setIsSaveRoutineDialogOpen(false);
      setIsActionDialogOpen(false);
      setRoutineNameInput('');
    } catch (err: any) {
      toast.error(err.message || t('workouts.history.saveRoutineError'));
    } finally {
      setSavingRoutine(false);
    }
  };

  const handleDelete = (workout: WorkoutLog) => {
    setWorkoutToDelete(workout);
    setIsActionDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!workoutToDelete) return;

    try {
      await deleteWorkoutLog(workoutToDelete.id);
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutToDelete.id));
      toast.success(t('workouts.history.deleted'));
      setWorkoutToDelete(null);
    } catch (err: any) {
      toast.error(err.message || t('workouts.history.deleteError'));
    }
  };

  const handleOpenActions = (workout: WorkoutLog) => {
    setSelectedWorkout(workout);
    setIsActionDialogOpen(true);
  };

  const handleShowDetails = (workout: WorkoutLog) => {
    setSelectedWorkout(workout);
    setIsActionDialogOpen(false);
    setIsDetailsDialogOpen(true);
  };

  const handleExerciseNameClick = async (
    exercise: WorkoutLog['exercises'][0],
    workout: WorkoutLog,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setSelectedExerciseForDetails({ exercise, workout });
    setExerciseDBDetails(null);
    setLoadingExerciseDetails(true);

    try {
      // If exercise has exerciseDBId, check cache first, then fetch from ExerciseDB API
      if (exercise.exerciseDBId) {
        // Check cache first
        const cached = getCachedExercise(exercise.exerciseDBId);
        if (cached) {
          setExerciseDBDetails(cached);
          setLoadingExerciseDetails(false);
          return;
        }

        // Not in cache, fetch from API
        try {
          const exerciseDBData = await getExerciseDBById(exercise.exerciseDBId);
          setExerciseDBDetails(exerciseDBData);
          // Cache it for future use
          cacheExercise(exerciseDBData);
        } catch (err) {
          console.error('Failed to fetch ExerciseDB details:', err);
          // Continue without ExerciseDB details
        }
      } else if (exercise.exerciseId) {
        // For custom exercises, try to get from Firestore
        try {
          const firestoreExercise = await getExerciseById(exercise.exerciseId);

          // If it has an exerciseDBId, check cache first, then fetch from ExerciseDB API
          if (firestoreExercise?.exerciseDBId) {
            // Check cache first
            const cached = getCachedExercise(firestoreExercise.exerciseDBId);
            if (cached) {
              setExerciseDBDetails(cached);
              setLoadingExerciseDetails(false);
              return;
            }

            // Not in cache, fetch from API
            try {
              const exerciseDBData = await getExerciseDBById(
                firestoreExercise.exerciseDBId
              );
              setExerciseDBDetails(exerciseDBData);
              // Cache it for future use
              cacheExercise(exerciseDBData);
            } catch (err) {
              console.error('Failed to fetch ExerciseDB details:', err);
              // Continue without ExerciseDB details
            }
          }
        } catch (err: any) {
          // Handle permission errors or missing exercises gracefully
          const isPermissionError =
            err?.code === 'permission-denied' ||
            err?.code === 'missing-permissions' ||
            err?.message?.includes('permissions') ||
            err?.message?.includes('Missing or insufficient');

          if (isPermissionError) {
            console.warn(
              'Cannot access exercise from Firestore (permission denied). Trying to search ExerciseDB by name as fallback...'
            );

            // Try to search ExerciseDB by exercise name as a fallback
            try {
              const searchResult = await getAllExercises({
                search: exercise.exerciseName,
                limit: 5, // Limit to 5 results
              });

              // Try to find an exact match by name
              const exactMatch = searchResult.exercises.find(
                (ex) =>
                  ex.name.toLowerCase() === exercise.exerciseName.toLowerCase()
              );

              if (exactMatch) {
                setExerciseDBDetails(exactMatch);
                // Cache it for future use
                cacheExercise(exactMatch);
                console.log(
                  'Found exercise in ExerciseDB by name:',
                  exactMatch.name
                );
              } else if (searchResult.exercises.length > 0) {
                // If no exact match, use the first result (closest match)
                const closestMatch = searchResult.exercises[0];
                setExerciseDBDetails(closestMatch);
                // Cache it for future use
                cacheExercise(closestMatch);
                console.log(
                  'Using closest match from ExerciseDB:',
                  closestMatch.name
                );
              }
            } catch (searchErr) {
              console.warn('Failed to search ExerciseDB by name:', searchErr);
              // Continue without ExerciseDB details
            }
          } else {
            console.error('Failed to fetch exercise:', err);
          }
        }
      }
    } finally {
      setLoadingExerciseDetails(false);
    }
  };

  const toggleExerciseExpansion = (
    workoutId: string,
    exerciseIndex: number
  ) => {
    const key = `${workoutId}-${exerciseIndex}`;
    setExpandedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Dumbbell className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          {t('workouts.history.noWorkouts')}
        </p>
      </div>
    );
  }

  let currentYear: number | null = null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          {t('workouts.history.title')}
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          {t('workouts.history.description')} ({workouts.length})
        </p>
      </div>

      <div className="space-y-12">
        {workoutsByMonth.map((monthGroup) => {
          const showYear = currentYear !== monthGroup.year;
          if (showYear) {
            currentYear = monthGroup.year;
          }

          const now = new Date();
          const isCurrentMonth =
            monthGroup.year === now.getFullYear() &&
            monthGroup.month === now.getMonth();

          return (
            <div
              key={`${monthGroup.year}-${monthGroup.month}`}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg text-muted-foreground">
                  {monthGroup.year}
                </span>
                <h3
                  className={`scroll-m-20 text-2xl font-semibold tracking-tight ${
                    isCurrentMonth ? 'border-b-2 border-pop' : ''
                  }`}
                >
                  {monthGroup.monthName}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  {monthGroup.workouts.map((workout) => (
                    <Card key={workout.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="break-words">
                              {workout.routineName ||
                                t('workouts.history.freeWorkout')}
                            </CardTitle>
                            <CardDescription className="mt-2 break-words">
                              {format(
                                workout.date,
                                i18n.language === 'fr'
                                  ? "d MMMM yyyy 'à' HH:mm"
                                  : "MMMM d, yyyy 'at' h:mm a",
                                { locale: dateLocale }
                              )}
                              {workout.duration && ` • ${workout.duration} min`}
                            </CardDescription>
                            {workout.routineName && (
                              <Badge variant="secondary" className="mt-2">
                                {t('workouts.history.routine')}
                              </Badge>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenActions(workout)}
                            className="h-8 w-8 shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3">
                          <h5 className="text-lg font-semibold flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            {t('workouts.history.exercises')}
                          </h5>

                          {/* Mobile: Card Layout */}
                          <div className="md:hidden space-y-3">
                            {workout.exercises.map((exercise, index) => {
                              const totalSets = exercise.sets.length;
                              const totalReps = exercise.sets.reduce(
                                (sum, set) => sum + (set.reps || 0),
                                0
                              );
                              const avgWeight =
                                exercise.sets.filter((s) => s.weight).length > 0
                                  ? exercise.sets
                                      .filter((s) => s.weight)
                                      .reduce(
                                        (sum, set) => sum + (set.weight || 0),
                                        0
                                      ) /
                                    exercise.sets.filter((s) => s.weight).length
                                  : null;
                              const completedSets = exercise.sets.filter(
                                (s) => s.completed
                              ).length;
                              const exerciseKey = `${workout.id}-${index}`;
                              const isExpanded =
                                expandedExercises.has(exerciseKey);

                              return (
                                <Card
                                  key={index}
                                  className={`cursor-pointer transition-colors p-1 ${
                                    isExpanded ? 'border-pop' : ''
                                  }`}
                                  onClick={() =>
                                    toggleExerciseExpansion(workout.id, index)
                                  }
                                >
                                  <CardContent className="p-3">
                                    <div className="space-y-2">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">
                                            {exercise.exerciseName}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleExerciseNameClick(
                                                exercise,
                                                workout,
                                                e
                                              );
                                            }}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={t(
                                              'workouts.history.viewExerciseDetails'
                                            )}
                                          >
                                            <Info className="h-4 w-4" />
                                          </button>
                                        </div>
                                        {exercise.notes && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {exercise.notes}
                                          </p>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">
                                            {t(
                                              'workouts.history.tableHeaders.sets'
                                            )}
                                            :
                                          </span>{' '}
                                          <span className="font-medium">
                                            {totalSets}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            {t(
                                              'workouts.history.tableHeaders.reps'
                                            )}
                                            :
                                          </span>{' '}
                                          <span className="font-medium">
                                            {totalReps > 0 ? totalReps : '-'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            {t(
                                              'workouts.history.tableHeaders.weight'
                                            )}
                                            :
                                          </span>{' '}
                                          <span className="font-medium">
                                            {avgWeight
                                              ? `${avgWeight.toFixed(1)} kg`
                                              : '-'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            {t(
                                              'workouts.history.tableHeaders.status'
                                            )}
                                            :
                                          </span>{' '}
                                          {completedSets > 0 ? (
                                            <Badge
                                              variant="outline"
                                              className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs"
                                            >
                                              {completedSets}/{totalSets}{' '}
                                              {t('workouts.history.completed')}
                                            </Badge>
                                          ) : (
                                            <span className="font-medium">
                                              -
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {isExpanded &&
                                        exercise.sets.length > 0 && (
                                          <div className="pt-3 border-t space-y-2">
                                            <h6 className="font-semibold text-sm">
                                              {t('workouts.history.sets')}
                                            </h6>
                                            <div className="space-y-1">
                                              {exercise.sets.map(
                                                (set, setIndex) => (
                                                  <div
                                                    key={setIndex}
                                                    className="flex items-center justify-between text-sm py-1 px-2 bg-muted/30 rounded"
                                                  >
                                                    <span className="font-medium">
                                                      {t(
                                                        'workouts.history.tableHeaders.sets'
                                                      )}{' '}
                                                      {set.setNumber}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                      <span>
                                                        {set.reps
                                                          ? `${set.reps} ${t('workouts.history.tableHeaders.reps')}`
                                                          : t(
                                                              'workouts.history.noReps'
                                                            )}
                                                      </span>
                                                      <span>
                                                        {set.weight
                                                          ? `${set.weight} kg`
                                                          : t(
                                                              'workouts.history.noWeight'
                                                            )}
                                                      </span>
                                                      {set.completed && (
                                                        <Badge
                                                          variant="outline"
                                                          className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs"
                                                        >
                                                          {t(
                                                            'workouts.history.completed'
                                                          )}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Desktop: Table Layout */}
                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>
                                    {t(
                                      'workouts.history.tableHeaders.exercises'
                                    )}
                                  </TableHead>
                                  <TableHead>
                                    {t('workouts.history.tableHeaders.sets')}
                                  </TableHead>
                                  <TableHead className="text-right">
                                    {t('workouts.history.tableHeaders.reps')}
                                  </TableHead>
                                  <TableHead className="text-right">
                                    {t('workouts.history.tableHeaders.weight')}
                                  </TableHead>
                                  <TableHead className="text-center">
                                    {t('workouts.history.tableHeaders.status')}
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {workout.exercises.map((exercise, index) => {
                                  const totalSets = exercise.sets.length;
                                  const totalReps = exercise.sets.reduce(
                                    (sum, set) => sum + (set.reps || 0),
                                    0
                                  );
                                  const avgWeight =
                                    exercise.sets.filter((s) => s.weight)
                                      .length > 0
                                      ? exercise.sets
                                          .filter((s) => s.weight)
                                          .reduce(
                                            (sum, set) =>
                                              sum + (set.weight || 0),
                                            0
                                          ) /
                                        exercise.sets.filter((s) => s.weight)
                                          .length
                                      : null;
                                  const completedSets = exercise.sets.filter(
                                    (s) => s.completed
                                  ).length;
                                  const exerciseKey = `${workout.id}-${index}`;
                                  const isExpanded =
                                    expandedExercises.has(exerciseKey);

                                  return (
                                    <React.Fragment key={index}>
                                      <TableRow
                                        className={`cursor-pointer hover:bg-muted/50 ${
                                          index < workout.exercises.length - 1
                                            ? 'border-b-2'
                                            : ''
                                        }`}
                                        onClick={() =>
                                          toggleExerciseExpansion(
                                            workout.id,
                                            index
                                          )
                                        }
                                      >
                                        <TableCell className="font-medium">
                                          <div className="flex items-center gap-2">
                                            <span>{exercise.exerciseName}</span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleExerciseNameClick(
                                                  exercise,
                                                  workout,
                                                  e
                                                );
                                              }}
                                              className="text-muted-foreground hover:text-foreground transition-colors"
                                              aria-label={t(
                                                'workouts.history.viewExerciseDetails'
                                              )}
                                            >
                                              <Info className="h-4 w-4" />
                                            </button>
                                          </div>
                                          {exercise.notes && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {exercise.notes}
                                            </p>
                                          )}
                                        </TableCell>
                                        <TableCell>{totalSets}</TableCell>
                                        <TableCell className="text-right">
                                          {totalReps > 0 ? totalReps : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {avgWeight
                                            ? `${avgWeight.toFixed(1)} kg`
                                            : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {completedSets > 0 ? (
                                            <Badge
                                              variant="outline"
                                              className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                            >
                                              {completedSets}/{totalSets}{' '}
                                              {t('workouts.history.completed')}
                                            </Badge>
                                          ) : (
                                            '-'
                                          )}
                                        </TableCell>
                                      </TableRow>
                                      {isExpanded &&
                                        exercise.sets.map((set, setIndex) => (
                                          <TableRow
                                            key={`set-${setIndex}`}
                                            className="bg-muted/30"
                                          >
                                            <TableCell className="font-medium">
                                              {/* Empty for alignment */}
                                            </TableCell>
                                            <TableCell>
                                              {set.setNumber}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {set.reps
                                                ? set.reps
                                                : t('workouts.history.noReps')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {set.weight
                                                ? `${set.weight} kg`
                                                : t(
                                                    'workouts.history.noWeight'
                                                  )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {set.completed ? (
                                                <Badge
                                                  variant="outline"
                                                  className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs"
                                                >
                                                  {t(
                                                    'workouts.history.completed'
                                                  )}
                                                </Badge>
                                              ) : (
                                                '-'
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </React.Fragment>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedWorkout?.routineName ||
                t('workouts.history.freeWorkout')}
            </DialogTitle>
            <DialogDescription>
              {format(
                selectedWorkout?.date || new Date(),
                i18n.language === 'fr'
                  ? "d MMMM yyyy 'à' HH:mm"
                  : "MMMM d, yyyy 'at' h:mm a",
                { locale: dateLocale }
              )}
              {selectedWorkout?.duration &&
                ` • ${selectedWorkout.duration} min`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                selectedWorkout && handleStartWorkout(selectedWorkout)
              }
            >
              <Play className="h-4 w-4 mr-2" />
              {t('workouts.history.startWorkout')}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                selectedWorkout && handleSaveAsRoutineClick(selectedWorkout)
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {t('workouts.history.saveAsRoutine')}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                selectedWorkout && handleShowDetails(selectedWorkout)
              }
            >
              <Info className="h-4 w-4 mr-2" />
              {t('workouts.history.details')}
            </Button>
            <Separator />
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => selectedWorkout && handleDelete(selectedWorkout)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('workouts.history.deleteFromHistory')}
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkout?.routineName ||
                t('workouts.history.freeWorkout')}
            </DialogTitle>
            <DialogDescription>
              {format(
                selectedWorkout?.date || new Date(),
                i18n.language === 'fr'
                  ? "d MMMM yyyy 'à' HH:mm"
                  : "MMMM d, yyyy 'at' h:mm a",
                { locale: dateLocale }
              )}
              {selectedWorkout?.duration &&
                ` • ${selectedWorkout.duration} min`}
            </DialogDescription>
          </DialogHeader>

          {selectedWorkout && (
            <div className="space-y-4">
              {selectedWorkout.notes && (
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
                    {t('workouts.history.notes')}
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedWorkout.notes}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  {t('workouts.history.exercises')}
                </h4>
                <div className="space-y-3">
                  {selectedWorkout.exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md space-y-2"
                    >
                      <div className="font-medium">{exercise.exerciseName}</div>
                      {exercise.notes && (
                        <p className="text-sm text-muted-foreground">
                          {exercise.notes}
                        </p>
                      )}
                      <div className="space-y-1">
                        {exercise.sets.map((set, setIndex) => (
                          <div
                            key={setIndex}
                            className="flex items-center gap-3 text-sm"
                          >
                            <span className="text-muted-foreground w-8">
                              {set.setNumber}
                            </span>
                            <span className="flex-1">
                              {set.reps && (
                                <span>
                                  {set.reps} {t('workouts.history.reps')}
                                </span>
                              )}
                              {set.reps && set.weight && ' × '}
                              {set.weight && <span>{set.weight} kg</span>}
                            </span>
                            {set.completed && (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                              >
                                {t('workouts.history.completed')}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise Details Dialog - Show ExerciseDB details if available */}
      {selectedExerciseForDetails && user && (
        <>
          {exerciseDBDetails ? (
            <ExerciseDetailsDialog
              exercise={exerciseDBDetails}
              open={!!selectedExerciseForDetails}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedExerciseForDetails(null);
                  setExerciseDBDetails(null);
                }
              }}
              userId={user.uid}
            />
          ) : (
            <Dialog
              open={!!selectedExerciseForDetails}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedExerciseForDetails(null);
                  setExerciseDBDetails(null);
                }
              }}
            >
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedExerciseForDetails.exercise.exerciseName}
                  </DialogTitle>
                  <DialogDescription>
                    {format(
                      selectedExerciseForDetails.workout.date || new Date(),
                      i18n.language === 'fr'
                        ? "d MMMM yyyy 'à' HH:mm"
                        : "MMMM d, yyyy 'at' h:mm a",
                      { locale: dateLocale }
                    )}
                  </DialogDescription>
                </DialogHeader>

                {loadingExerciseDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {t('workouts.history.exerciseDetailsNotAvailable')}
                      </p>
                    </div>

                    {selectedExerciseForDetails.exercise.notes && (
                      <div className="p-4 bg-muted rounded-md">
                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
                          {t('workouts.history.notes')}
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedExerciseForDetails.exercise.notes}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        {t('workouts.history.sets')}
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {t('workouts.history.tableHeaders.sets')}
                            </TableHead>
                            <TableHead className="text-right">
                              {t('workouts.history.tableHeaders.reps')}
                            </TableHead>
                            <TableHead className="text-right">
                              {t('workouts.history.tableHeaders.weight')}
                            </TableHead>
                            <TableHead className="text-center">
                              {t('workouts.history.tableHeaders.status')}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedExerciseForDetails.exercise.sets.length >
                          0 ? (
                            selectedExerciseForDetails.exercise.sets.map(
                              (set, setIndex) => (
                                <TableRow key={setIndex}>
                                  <TableCell className="font-medium">
                                    {set.setNumber}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {set.reps
                                      ? set.reps
                                      : t('workouts.history.noReps')}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {set.weight
                                      ? `${set.weight} kg`
                                      : t('workouts.history.noWeight')}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {set.completed ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                      >
                                        {t('workouts.history.completed')}
                                      </Badge>
                                    ) : (
                                      '-'
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            )
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center text-muted-foreground"
                              >
                                {t('workouts.history.noSets')}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedExerciseForDetails(null);
                      setExerciseDBDetails(null);
                    }}
                  >
                    {t('common.close')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

      {/* Save as Routine Dialog */}
      <Dialog
        open={isSaveRoutineDialogOpen}
        onOpenChange={(open) => {
          setIsSaveRoutineDialogOpen(open);
          if (!open) {
            setRoutineNameInput('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workouts.history.saveAsRoutine')}</DialogTitle>
            <DialogDescription>
              {t('workouts.history.saveAsRoutineDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="routine-name">
                {t('workouts.routines.name')} *
              </Label>
              <Input
                id="routine-name"
                value={routineNameInput}
                onChange={(e) => setRoutineNameInput(e.target.value)}
                placeholder={t('workouts.routines.namePlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && routineNameInput.trim()) {
                    handleSaveAsRoutine();
                  }
                }}
                autoFocus
              />
            </div>
            {selectedWorkout && (
              <div className="text-sm text-muted-foreground">
                <p>
                  {t(
                    selectedWorkout.exercises.length === 1
                      ? 'workouts.history.routineWillContain_one'
                      : 'workouts.history.routineWillContain_other',
                    {
                      count: selectedWorkout.exercises.length,
                    }
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveRoutineDialogOpen(false);
                setRoutineNameInput('');
              }}
              disabled={savingRoutine}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveAsRoutine}
              disabled={savingRoutine || !routineNameInput.trim()}
            >
              {savingRoutine && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('workouts.routines.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!workoutToDelete}
        onOpenChange={(open) => !open && setWorkoutToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('workouts.history.confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {workoutToDelete &&
                t('workouts.history.confirmDeleteDescription', {
                  date: format(workoutToDelete.date, 'PP', {
                    locale: i18n.language === 'fr' ? fr : enUS,
                  }),
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
