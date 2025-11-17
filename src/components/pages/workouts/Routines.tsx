import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { getRoutinesByUserId, deleteRoutine } from '@/services/workoutService';
import type { WorkoutRoutine } from '@/types/workout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Play,
  Trash2,
  Loader2,
  Calendar,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from '@/components/ui/item';
import { toast } from 'sonner';
import CreateEditRoutineDialog from './components/CreateEditRoutineDialog';
import ExerciseDetailsDialog from './components/ExerciseDetailsDialog';
import { getExerciseById } from '@/services/workoutService';
import {
  getExerciseById as getExerciseDBById,
  getAllExercises,
} from '@/services/exerciseDBService';
import { useExerciseCacheStore } from '@/stores/exerciseCacheStore';
import type { ExerciseDBExercise } from '@/types/workout';

export default function Routines() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<WorkoutRoutine | null>(
    null
  );
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(
    new Set()
  );
  const [selectedExerciseForDetails, setSelectedExerciseForDetails] = useState<{
    exercise: WorkoutRoutine['exercises'][0];
    routine: WorkoutRoutine;
  } | null>(null);
  const [exerciseDBDetails, setExerciseDBDetails] =
    useState<ExerciseDBExercise | null>(null);
  const [loadingExerciseDetails, setLoadingExerciseDetails] = useState(false);
  const { getExercise: getCachedExercise, setExercise: cacheExercise } =
    useExerciseCacheStore();

  // Load routines
  useEffect(() => {
    if (!user?.uid) return;

    const loadRoutines = async () => {
      setLoading(true);
      setError('');
      try {
        const routinesData = await getRoutinesByUserId(user.uid);
        setRoutines(routinesData);
      } catch (err: any) {
        setError(err.message || t('workouts.routines.loadError'));
        console.error('Failed to load routines:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoutines();
  }, [user?.uid, t]);

  const handleDeleteRoutine = async () => {
    if (!routineToDelete) return;

    try {
      await deleteRoutine(routineToDelete.id);
      setRoutines(routines.filter((r) => r.id !== routineToDelete.id));
      toast.success(t('workouts.routines.deleted'));
      setRoutineToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete routine:', err);
      toast.error(t('workouts.routines.deleteError'));
    }
  };

  const handleStartWorkout = (routine: WorkoutRoutine) => {
    // Dispatch event to switch to log tab and select routine
    const event = new CustomEvent('workout-tab-change', {
      detail: 'log',
    });
    window.dispatchEvent(event);

    // Store routine ID in sessionStorage for LogWorkout to pick up
    sessionStorage.setItem('selectedRoutineId', routine.id);

    // Small delay to ensure tab switch happens first
    setTimeout(() => {
      // Trigger a custom event that LogWorkout can listen to
      window.dispatchEvent(
        new CustomEvent('select-routine', {
          detail: routine.id,
        })
      );
    }, 100);
  };

  const handleRoutineCreated = (routine: WorkoutRoutine) => {
    setRoutines([routine, ...routines]);
    setIsCreateDialogOpen(false);
  };

  const toggleRoutineExpansion = (routineId: string) => {
    setExpandedRoutines((prev) => {
      const next = new Set(prev);
      if (next.has(routineId)) {
        next.delete(routineId);
      } else {
        next.add(routineId);
      }
      return next;
    });
  };

  const handleExerciseNameClick = async (
    exercise: WorkoutRoutine['exercises'][0],
    routine: WorkoutRoutine,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setLoadingExerciseDetails(true);
    setSelectedExerciseForDetails({ exercise, routine });
    setExerciseDBDetails(null);

    try {
      // Try to get from cache first
      if (exercise.exerciseDBId) {
        const cached = getCachedExercise(exercise.exerciseDBId);
        if (cached) {
          setExerciseDBDetails(cached);
          setLoadingExerciseDetails(false);
          return;
        }

        // Try to fetch from ExerciseDB API
        try {
          const exerciseDB = await getExerciseDBById(exercise.exerciseDBId);
          if (exerciseDB) {
            cacheExercise(exerciseDB);
            setExerciseDBDetails(exerciseDB);
            setLoadingExerciseDetails(false);
            return;
          }
        } catch (err) {
          console.warn('Failed to fetch from ExerciseDB:', err);
        }
      }

      // Fallback: Try to get from Firestore (custom exercise)
      if (exercise.exerciseId) {
        try {
          const customExercise = await getExerciseById(exercise.exerciseId);
          if (customExercise) {
            // Convert custom exercise to ExerciseDB format for display
            const exerciseDBFormat: ExerciseDBExercise = {
              exerciseId: customExercise.id,
              name: customExercise.name,
              equipments: customExercise.equipment || [],
              bodyParts: customExercise.bodyParts || [],
              exerciseTypes: [],
              difficulty: '',
              targetMuscles: customExercise.targetMuscles || [],
              secondaryMuscles: customExercise.secondaryMuscles || [],
              imageUrl: customExercise.imageUrl,
              gifUrl: customExercise.imageUrl,
              videoUrl: customExercise.videoUrl,
              keywords: customExercise.keywords || [],
              overview: customExercise.overview,
              instructions: customExercise.instructions || [],
              exerciseTips: customExercise.exerciseTips || [],
              variations: customExercise.variations || [],
              relatedExerciseIds: customExercise.relatedExerciseIds || [],
            };
            setExerciseDBDetails(exerciseDBFormat);
            setLoadingExerciseDetails(false);
            return;
          }
        } catch (err: any) {
          console.warn(
            'Cannot access exercise from Firestore (permission denied). This may be a custom exercise or the exercise may have been deleted.'
          );

          // Final fallback: Search ExerciseDB by name
          try {
            const allExercisesData = await getAllExercises();
            const match = allExercisesData.exercises.find(
              (ex: ExerciseDBExercise) =>
                ex.name.toLowerCase() === exercise.exerciseName.toLowerCase()
            );
            if (match) {
              cacheExercise(match);
              setExerciseDBDetails(match);
              setLoadingExerciseDetails(false);
              return;
            }
          } catch (searchErr) {
            console.warn('Failed to search ExerciseDB:', searchErr);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch exercise:', error);
    } finally {
      setLoadingExerciseDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button
          onClick={() => {
            if (user?.uid) {
              const loadRoutines = async () => {
                setLoading(true);
                setError('');
                try {
                  const routinesData = await getRoutinesByUserId(user.uid);
                  setRoutines(routinesData);
                } catch (err: any) {
                  setError(err.message || t('workouts.routines.loadError'));
                } finally {
                  setLoading(false);
                }
              };
              loadRoutines();
            }
          }}
          variant="outline"
        >
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {t('workouts.routines.title')}
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            {t('workouts.routines.description')}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('workouts.routines.createRoutine')}
        </Button>
      </div>

      {/* Routines List */}
      {routines.length === 0 ? (
        <Card className="p-12 text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            {t('workouts.routines.noRoutines')}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('workouts.routines.createFirstRoutine')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine) => (
            <Card
              key={routine.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">
                      {routine.name}
                    </CardTitle>
                    {routine.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {routine.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Exercise Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Dumbbell className="h-4 w-4" />
                  <span>
                    {routine.exercises.length}{' '}
                    {routine.exercises.length === 1
                      ? t('workouts.routines.exercise')
                      : t('workouts.routines.exerciseCount')}
                  </span>
                </div>

                {/* Exercises List */}
                {routine.exercises.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleRoutineExpansion(routine.id)}
                      className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>
                        {t('workouts.history.exercises')} (
                        {routine.exercises.length})
                      </span>
                      {expandedRoutines.has(routine.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {expandedRoutines.has(routine.id) && (
                      <ItemGroup className="pt-2">
                        {routine.exercises.map((exercise, index) => (
                          <Item key={index} variant="muted">
                            <ItemContent>
                              <ItemTitle className="flex items-center gap-2">
                                {exercise.exerciseName}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExerciseNameClick(
                                      exercise,
                                      routine,
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
                              </ItemTitle>
                              {exercise.notes && (
                                <ItemDescription>
                                  {exercise.notes}
                                </ItemDescription>
                              )}
                            </ItemContent>
                          </Item>
                        ))}
                      </ItemGroup>
                    )}
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {t('workouts.routines.createdDate')}{' '}
                    {new Date(routine.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => handleStartWorkout(routine)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('workouts.routines.startWorkout')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoutineToDelete(routine)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Routine Dialog */}
      <CreateEditRoutineDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onRoutineCreated={handleRoutineCreated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!routineToDelete}
        onOpenChange={(open) => !open && setRoutineToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('workouts.routines.confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {routineToDelete &&
                t('workouts.routines.deleteMessage', {
                  name: routineToDelete.name,
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoutine}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exercise Details Dialog */}
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedExerciseForDetails.exercise.exerciseName}
                  </DialogTitle>
                </DialogHeader>
                {loadingExerciseDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t('workouts.history.exerciseDetailsNotAvailable')}
                    </p>
                    {selectedExerciseForDetails.exercise.notes && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          {t('workouts.history.notes')}
                        </h4>
                        <p className="text-sm">
                          {selectedExerciseForDetails.exercise.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}
