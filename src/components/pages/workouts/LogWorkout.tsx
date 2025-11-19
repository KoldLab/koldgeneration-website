import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { parseDate } from 'chrono-node';
import ExerciseEntryForm from './components/ExerciseEntryForm';
import ExerciseSelectorDialog from './components/ExerciseSelectorDialog';
import RoutineSelectorDialog from './components/RoutineSelectorDialog';
import WorkoutDetails from './WorkoutDetails';
import {
  getExercisesByUserId,
  createWorkoutLog,
  getRoutinesByUserId,
  getRoutineById,
} from '@/services/workoutService';
import type {
  ExerciseEntry,
  WorkoutRoutine,
  WorkoutLog,
} from '@/types/workout';

export default function LogWorkout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get workout state from store
  const {
    workoutEntries,
    workoutDate: storedWorkoutDate,
    workoutDuration: storedWorkoutDuration,
    workoutNotes: storedWorkoutNotes,
    selectedRoutineId: storedSelectedRoutineId,
    collapsedExercises,
    setWorkoutEntries,
    setWorkoutDate,
    setWorkoutDuration,
    setWorkoutNotes,
    setSelectedRoutineId,
    updateWorkoutEntry,
    removeWorkoutEntry,
    addWorkoutEntry,
    clearWorkout,
    setExerciseCollapsed,
  } = useWorkoutStore();

  // Data
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [exerciseSelectorOpen, setExerciseSelectorOpen] = useState(false);
  const [routineSelectorOpen, setRoutineSelectorOpen] = useState(false);
  const [workoutDetailsOpen, setWorkoutDetailsOpen] = useState(true);

  // Form state - initialize from store or defaults
  const today = new Date();
  const [workoutDate, setWorkoutDateState] = useState<Date | undefined>(
    storedWorkoutDate ? new Date(storedWorkoutDate) : today
  );
  const [workoutDateMonth, setWorkoutDateMonth] = useState<Date | undefined>(
    storedWorkoutDate ? new Date(storedWorkoutDate) : today
  );
  const [workoutDateOpen, setWorkoutDateOpen] = useState(false);
  const [workoutDateValue, setWorkoutDateValue] = useState<string>(
    storedWorkoutDate
      ? new Date(storedWorkoutDate).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : today.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
  );
  const [selectedRoutineId, setSelectedRoutineIdState] = useState<string>(
    storedSelectedRoutineId || 'none'
  );
  const [workoutDuration, setWorkoutDurationState] = useState<string>(
    storedWorkoutDuration || ''
  );
  const [workoutNotes, setWorkoutNotesState] = useState<string>(
    storedWorkoutNotes || ''
  );

  // Sync local state with store
  useEffect(() => {
    if (storedWorkoutDate) {
      const date = new Date(storedWorkoutDate);
      setWorkoutDateState(date);
      setWorkoutDateMonth(date);
      setWorkoutDateValue(
        date.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      );
    }
  }, [storedWorkoutDate]);

  useEffect(() => {
    setSelectedRoutineIdState(storedSelectedRoutineId);
  }, [storedSelectedRoutineId]);

  useEffect(() => {
    setWorkoutDurationState(storedWorkoutDuration);
  }, [storedWorkoutDuration]);

  useEffect(() => {
    setWorkoutNotesState(storedWorkoutNotes);
  }, [storedWorkoutNotes]);

  // Load exercises and routines
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [, routinesData] = await Promise.all([
          getExercisesByUserId(user.uid),
          getRoutinesByUserId(user.uid),
        ]);
        setRoutines(routinesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(t('workouts.logWorkout.errorLoadingData'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, t]);

  // Listen for routine selection from Routines page
  useEffect(() => {
    const handleSelectRoutine = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedRoutineIdState(customEvent.detail);
        setSelectedRoutineId(customEvent.detail);
      }
    };

    window.addEventListener('select-routine', handleSelectRoutine);
    return () => {
      window.removeEventListener('select-routine', handleSelectRoutine);
    };
  }, [setSelectedRoutineId]);

  // Check sessionStorage for routine ID on mount
  useEffect(() => {
    const storedRoutineId = sessionStorage.getItem('selectedRoutineId');
    if (storedRoutineId && storedRoutineId !== 'none') {
      setSelectedRoutineIdState(storedRoutineId);
      setSelectedRoutineId(storedRoutineId);
      sessionStorage.removeItem('selectedRoutineId'); // Clear after use
    }
  }, [setSelectedRoutineId]);

  // Load routine when selected
  useEffect(() => {
    if (selectedRoutineId === 'none' || !selectedRoutineId) {
      return;
    }

    const loadRoutine = async () => {
      try {
        const routine = await getRoutineById(selectedRoutineId);
        if (routine) {
          // Convert routine exercises to workout entries with set data as defaults
          const entries: ExerciseEntry[] = routine.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((set) => ({
              ...set,
              completed: false, // Reset completion status
            })),
          }));
          setWorkoutEntries(entries);
        }
      } catch (error) {
        console.error('Error loading routine:', error);
        toast.error(t('workouts.logWorkout.errorLoadingRoutine'));
      }
    };

    loadRoutine();
  }, [selectedRoutineId, t, setWorkoutEntries]);

  const handleAddExercise = () => {
    setExerciseSelectorOpen(true);
  };

  const handleSelectExercise = (entry: ExerciseEntry) => {
    // Automatically add 1 set when exercise is selected
    const entryWithSet: ExerciseEntry = {
      ...entry,
      sets: [
        {
          setNumber: 1,
          completed: false,
        },
      ],
    };
    addWorkoutEntry(entryWithSet);
  };

  const handleUpdateEntry = (index: number, updatedEntry: ExerciseEntry) => {
    updateWorkoutEntry(index, updatedEntry);
  };

  const handleRemoveEntry = (index: number) => {
    removeWorkoutEntry(index);
  };

  // Helper function to recursively remove undefined values from objects
  const removeUndefinedValues = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (Array.isArray(obj)) {
      // For arrays, clean each item but keep all items (don't filter)
      return obj.map(removeUndefinedValues);
    }
    if (typeof obj === 'object') {
      // For objects, remove properties with undefined values or empty strings
      const cleaned: any = {};
      for (const key in obj) {
        const value = removeUndefinedValues(obj[key]);
        // Remove undefined values and empty strings (for optional fields like notes)
        if (value !== undefined && value !== '') {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }
    return obj;
  };

  const handleSaveWorkout = async () => {
    if (!user) return;

    if (workoutEntries.length === 0) {
      toast.error(t('workouts.logWorkout.noExercisesError'));
      return;
    }

    // Validate that at least one exercise has sets
    const hasSets = workoutEntries.some((entry) => entry.sets.length > 0);
    if (!hasSets) {
      toast.error(t('workouts.logWorkout.noSetsError'));
      return;
    }

    setSaving(true);
    try {
      const selectedRoutine =
        selectedRoutineId !== 'none'
          ? routines.find((r) => r.id === selectedRoutineId)
          : null;

      if (!workoutDate) {
        toast.error(t('workouts.logWorkout.dateRequired'));
        return;
      }

      // Clean workoutEntries to remove undefined values
      const cleanedExercises = removeUndefinedValues(workoutEntries);

      const workoutLog: Omit<
        WorkoutLog,
        'id' | 'userId' | 'createdAt' | 'updatedAt'
      > = {
        ...(selectedRoutine?.id && { routineId: selectedRoutine.id }),
        ...(selectedRoutine?.name && { routineName: selectedRoutine.name }),
        date: workoutDate,
        exercises: cleanedExercises,
        ...(workoutNotes && { notes: workoutNotes }),
        ...(workoutDuration && {
          duration: parseInt(workoutDuration, 10),
        }),
      };

      await createWorkoutLog(user.uid, workoutLog);
      toast.success(t('workouts.logWorkout.saveSuccess'));

      // Reset form and clear store
      clearWorkout();
      const resetDate = new Date();
      setWorkoutDateState(resetDate);
      setWorkoutDateMonth(resetDate);
      setWorkoutDateValue(
        resetDate.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      );
      setSelectedRoutineIdState('none');
      setWorkoutDurationState('');
      setWorkoutNotesState('');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error(t('workouts.logWorkout.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          {t('workouts.logWorkout.title')}
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          {t('workouts.logWorkout.description')}
        </p>
      </div>

      {/* Workout Details */}
      <WorkoutDetails
        workoutDate={workoutDate}
        workoutDateValue={workoutDateValue}
        workoutDateMonth={workoutDateMonth}
        workoutDateOpen={workoutDateOpen}
        workoutDuration={workoutDuration}
        workoutNotes={workoutNotes}
        workoutDetailsOpen={workoutDetailsOpen}
        onWorkoutDateChange={(date) => {
          const dateValue = date ?? undefined;
          setWorkoutDateState(dateValue);
          setWorkoutDate(dateValue ?? null);
        }}
        onWorkoutDateValueChange={(value) => {
          setWorkoutDateValue(value);
          const parsedDate = parseDate(value);
          if (parsedDate) {
            setWorkoutDateState(parsedDate);
            setWorkoutDateMonth(parsedDate);
            setWorkoutDate(parsedDate);
          }
        }}
        onWorkoutDateMonthChange={(date) =>
          setWorkoutDateMonth(date ?? undefined)
        }
        onWorkoutDateOpenChange={setWorkoutDateOpen}
        onWorkoutDurationChange={(value) => {
          setWorkoutDurationState(value);
          setWorkoutDuration(value);
        }}
        onWorkoutNotesChange={(value) => {
          setWorkoutNotesState(value);
          setWorkoutNotes(value);
        }}
        onWorkoutDetailsOpenChange={setWorkoutDetailsOpen}
      />

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {t('workouts.logWorkout.exercises')} ({workoutEntries.length})
          </h3>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {routines.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoutineSelectorOpen(true)}
                className="gap-2 flex-1 sm:flex-none"
              >
                <FileDown className="h-4 w-4" />
                {t('workouts.logWorkout.startFromRoutine')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddExercise}
              className="gap-2 flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              {t('workouts.logWorkout.addExercise')}
            </Button>
          </div>
        </div>

        {workoutEntries.length === 0 ? (
          <div className="p-8 text-center border rounded-md">
            <p className="text-muted-foreground">
              {t('workouts.logWorkout.noExercisesMessage')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workoutEntries.map((entry, index) => (
              <ExerciseEntryForm
                key={index}
                entry={entry}
                onUpdate={(updatedEntry) =>
                  handleUpdateEntry(index, updatedEntry)
                }
                onRemove={() => handleRemoveEntry(index)}
                showRemove={true}
                isCollapsed={
                  collapsedExercises[
                    entry.exerciseId ||
                      entry.exerciseDBId ||
                      `exercise-${index}`
                  ] || false
                }
                onCollapsedChange={(collapsed) =>
                  setExerciseCollapsed(
                    entry.exerciseId ||
                      entry.exerciseDBId ||
                      `exercise-${index}`,
                    collapsed
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      {workoutEntries.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveWorkout}
            disabled={saving}
            className="gap-2 w-full sm:w-auto"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('workouts.logWorkout.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('workouts.logWorkout.saveWorkout')}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Exercise Selector Dialog */}
      {user && (
        <ExerciseSelectorDialog
          open={exerciseSelectorOpen}
          onOpenChange={setExerciseSelectorOpen}
          onSelectExercise={handleSelectExercise}
          userId={user.uid}
        />
      )}

      {/* Routine Selector Dialog */}
      <RoutineSelectorDialog
        open={routineSelectorOpen}
        onOpenChange={setRoutineSelectorOpen}
        routines={routines}
        selectedRoutineId={selectedRoutineId}
        onSelectRoutine={(routineId) => {
          setSelectedRoutineIdState(routineId);
          setSelectedRoutineId(routineId);
        }}
      />
    </div>
  );
}
