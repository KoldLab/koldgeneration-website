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
} from '@/services/workoutService';
import type { WorkoutLog, WorkoutRoutine } from '@/types/workout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
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
      const monthName = format(workout.date, 'MMMM', {
        locale: i18n.language === 'fr' ? fr : enUS,
      });

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
      exerciseId: ex.exerciseId,
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

  const handleSaveAsRoutine = async (workout: WorkoutLog) => {
    if (!user) return;

    const routineName = prompt(
      t('workouts.history.enterRoutineName') || 'Enter routine name:'
    );
    if (!routineName) return;

    try {
      const routineData: Omit<
        WorkoutRoutine,
        'id' | 'userId' | 'createdAt' | 'updatedAt'
      > = {
        name: routineName,
        description: workout.notes || '',
        exercises: workout.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: [],
          notes: ex.notes,
        })),
      };

      await createRoutine(user.uid, routineData);
      toast.success(t('workouts.history.savedAsRoutine'));
      setIsActionDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || t('workouts.history.saveRoutineError'));
    }
  };

  const handleDelete = async (workoutId: string) => {
    if (!confirm(t('workouts.history.confirmDelete'))) return;

    try {
      await deleteWorkoutLog(workoutId);
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      toast.success(t('workouts.history.deleted'));
      setIsActionDialogOpen(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('workouts.history.title')}</h2>
          <p className="text-muted-foreground mt-1">
            {t('workouts.history.description')} ({workouts.length})
          </p>
        </div>
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
                  className={`text-3xl font-bold ${
                    isCurrentMonth ? 'underline' : ''
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
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>
                              {workout.routineName ||
                                t('workouts.history.freeWorkout')}
                            </CardTitle>
                            <CardDescription className="mt-2">
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
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3">
                          <h5 className="font-semibold text-sm flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            {t('workouts.history.exercises')}
                          </h5>
                          <div className="space-y-3">
                            {workout.exercises.map((exercise, index) => (
                              <div
                                key={index}
                                className="p-3 border rounded-md space-y-2"
                              >
                                <div className="font-medium">
                                  {exercise.exerciseName}
                                </div>
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
                                            {set.reps}{' '}
                                            {t('workouts.history.reps')}
                                          </span>
                                        )}
                                        {set.reps && set.weight && ' × '}
                                        {set.weight && (
                                          <span>{set.weight} kg</span>
                                        )}
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
                selectedWorkout && handleSaveAsRoutine(selectedWorkout)
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
              onClick={() =>
                selectedWorkout && handleDelete(selectedWorkout.id)
              }
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
                  <h4 className="font-semibold mb-2">
                    {t('workouts.history.notes')}
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedWorkout.notes}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
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
    </div>
  );
}
