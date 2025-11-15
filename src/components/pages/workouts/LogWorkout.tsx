import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Plus, Save, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { parseDate } from 'chrono-node';
import ExerciseEntryForm from './components/ExerciseEntryForm';
import ExerciseSelectorDialog from './components/ExerciseSelectorDialog';
import {
  getExercisesByUserId,
  createWorkoutLog,
  getRoutinesByUserId,
  getRoutineById,
} from '@/services/workoutService';
import type {
  Exercise,
  ExerciseEntry,
  WorkoutRoutine,
  WorkoutLog,
} from '@/types/workout';

export default function LogWorkout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [workoutEntries, setWorkoutEntries] = useState<ExerciseEntry[]>([]);
  const [exerciseSelectorOpen, setExerciseSelectorOpen] = useState(false);

  // Form state
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('none');
  const today = new Date();
  const [workoutDate, setWorkoutDate] = useState<Date | undefined>(today);
  const [workoutDateMonth, setWorkoutDateMonth] = useState<Date | undefined>(
    today
  );
  const [workoutDateOpen, setWorkoutDateOpen] = useState(false);
  const [workoutDateValue, setWorkoutDateValue] = useState<string>(
    today.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  );
  const [workoutDuration, setWorkoutDuration] = useState<string>('');
  const [workoutNotes, setWorkoutNotes] = useState<string>('');

  // Load exercises and routines
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [exercisesData, routinesData] = await Promise.all([
          getExercisesByUserId(user.uid),
          getRoutinesByUserId(user.uid),
        ]);
        setExercises(exercisesData);
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

  // Load routine when selected
  useEffect(() => {
    if (selectedRoutineId === 'none' || !selectedRoutineId) {
      return;
    }

    const loadRoutine = async () => {
      try {
        const routine = await getRoutineById(selectedRoutineId);
        if (routine) {
          // Convert routine exercises to workout entries (without set data)
          const entries: ExerciseEntry[] = routine.exercises.map((ex) => ({
            ...ex,
            sets: [], // Start with empty sets
          }));
          setWorkoutEntries(entries);
        }
      } catch (error) {
        console.error('Error loading routine:', error);
        toast.error(t('workouts.logWorkout.errorLoadingRoutine'));
      }
    };

    loadRoutine();
  }, [selectedRoutineId, t]);

  const handleAddExercise = () => {
    setExerciseSelectorOpen(true);
  };

  const handleSelectExercise = (entry: ExerciseEntry) => {
    setWorkoutEntries([...workoutEntries, entry]);
  };

  const handleUpdateEntry = (index: number, updatedEntry: ExerciseEntry) => {
    const updated = [...workoutEntries];
    updated[index] = updatedEntry;
    setWorkoutEntries(updated);
  };

  const handleRemoveEntry = (index: number) => {
    const updated = workoutEntries.filter((_, i) => i !== index);
    setWorkoutEntries(updated);
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

      const workoutLog: Omit<
        WorkoutLog,
        'id' | 'userId' | 'createdAt' | 'updatedAt'
      > = {
        routineId: selectedRoutine?.id,
        routineName: selectedRoutine?.name,
        date: workoutDate,
        exercises: workoutEntries,
        notes: workoutNotes || undefined,
        duration: workoutDuration ? parseInt(workoutDuration, 10) : undefined,
      };

      await createWorkoutLog(user.uid, workoutLog);
      toast.success(t('workouts.logWorkout.saveSuccess'));

      // Reset form
      setWorkoutEntries([]);
      setSelectedRoutineId('none');
      const resetDate = new Date();
      setWorkoutDate(resetDate);
      setWorkoutDateMonth(resetDate);
      setWorkoutDateValue(
        resetDate.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      );
      setWorkoutDuration('');
      setWorkoutNotes('');
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
        <h2 className="text-2xl font-bold">{t('workouts.logWorkout.title')}</h2>
        <p className="text-muted-foreground mt-1">
          {t('workouts.logWorkout.description')}
        </p>
      </div>

      {/* Workout Details */}
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="workout-date">
              {t('workouts.logWorkout.date')}
            </Label>
            <div className="relative flex gap-2">
              <Input
                id="workout-date"
                value={workoutDateValue}
                placeholder="Today, Tomorrow, or next week"
                className="bg-background pr-10"
                onChange={(e) => {
                  setWorkoutDateValue(e.target.value);
                  const parsedDate = parseDate(e.target.value);
                  if (parsedDate) {
                    setWorkoutDate(parsedDate);
                    setWorkoutDateMonth(parsedDate);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setWorkoutDateOpen(true);
                  }
                }}
              />
              <Popover open={workoutDateOpen} onOpenChange={setWorkoutDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="date-picker"
                    variant="ghost"
                    className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                  >
                    <CalendarIcon className="size-3.5" />
                    <span className="sr-only">Select date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="end"
                >
                  <Calendar
                    mode="single"
                    selected={workoutDate}
                    captionLayout="dropdown"
                    month={workoutDateMonth}
                    onMonthChange={setWorkoutDateMonth}
                    onSelect={(date) => {
                      setWorkoutDate(date);
                      if (date) {
                        setWorkoutDateValue(
                          date.toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        );
                      }
                      setWorkoutDateOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-duration">
              {t('workouts.logWorkout.duration')} (minutes)
            </Label>
            <Input
              id="workout-duration"
              type="number"
              min="0"
              value={workoutDuration}
              onChange={(e) => setWorkoutDuration(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        {routines.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="routine-select">
              {t('workouts.logWorkout.startFromRoutine')} (optional)
            </Label>
            <Select
              value={selectedRoutineId}
              onValueChange={setSelectedRoutineId}
            >
              <SelectTrigger id="routine-select">
                <SelectValue
                  placeholder={t('workouts.logWorkout.selectRoutine')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t('workouts.logWorkout.startFromScratch')}
                </SelectItem>
                {routines.map((routine) => (
                  <SelectItem key={routine.id} value={routine.id}>
                    {routine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="workout-notes">
            {t('workouts.logWorkout.overallNotes')} (optional)
          </Label>
          <Textarea
            id="workout-notes"
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder={t('workouts.logWorkout.notesPlaceholder')}
            rows={3}
          />
        </div>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {t('workouts.logWorkout.exercises')} ({workoutEntries.length})
          </h3>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddExercise}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('workouts.logWorkout.addExercise')}
          </Button>
        </div>

        {workoutEntries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {t('workouts.logWorkout.noExercisesMessage')}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddExercise}
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('workouts.logWorkout.addFirstExercise')}
            </Button>
          </Card>
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
            className="gap-2"
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
    </div>
  );
}
