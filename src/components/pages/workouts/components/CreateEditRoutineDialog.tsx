import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  createRoutine,
  updateRoutine,
  getRoutineById,
} from '@/services/workoutService';
import type { WorkoutRoutine, ExerciseEntry } from '@/types/workout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X, Edit } from 'lucide-react';
import { toast } from 'sonner';
import ExerciseSelectorDialog from './ExerciseSelectorDialog';
import ExerciseEntryForm from './ExerciseEntryForm';
import { useWorkoutStore } from '@/stores/workoutStore';

interface CreateEditRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: WorkoutRoutine | null;
  onRoutineCreated?: (routine: WorkoutRoutine) => void;
  onRoutineUpdated?: (routine: WorkoutRoutine) => void;
}

export default function CreateEditRoutineDialog({
  open,
  onOpenChange,
  routine,
  onRoutineCreated,
  onRoutineUpdated,
}: CreateEditRoutineDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  const isEditing = !!routine;

  // Load routine data when editing
  useEffect(() => {
    if (open && routine) {
      setName(routine.name);
      setDescription(routine.description || '');
      setExercises(routine.exercises || []);
    } else if (open && !routine) {
      // Reset for new routine
      setName('');
      setDescription('');
      setExercises([]);
    }
  }, [open, routine]);

  const handleAddExercise = (entry: ExerciseEntry) => {
    setExercises([...exercises, entry]);
    setIsExerciseSelectorOpen(false);
  };

  const handleUpdateExercise = (index: number, updatedEntry: ExerciseEntry) => {
    const updated = [...exercises];
    updated[index] = updatedEntry;
    setExercises(updated);
    setEditingExerciseIndex(null);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    if (!name.trim()) {
      toast.error(t('workouts.routines.nameRequired'));
      return;
    }

    if (exercises.length === 0) {
      toast.error(t('workouts.routines.exercisesRequired'));
      return;
    }

    setSaving(true);
    try {
      if (isEditing && routine) {
        await updateRoutine(routine.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          exercises,
        });
        
        // Reload the routine to get updated data
        const updated = await getRoutineById(routine.id);
        if (updated) {
          onRoutineUpdated?.(updated);
          toast.success(t('workouts.routines.updated'));
          onOpenChange(false);
        }
      } else {
        const newRoutine = await createRoutine(user.uid, {
          name: name.trim(),
          description: description.trim() || undefined,
          exercises,
        });
        onRoutineCreated?.(newRoutine);
        toast.success(t('workouts.routines.createdSuccess'));
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error(
        isEditing
          ? t('workouts.routines.updateError')
          : t('workouts.routines.createError')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? t('workouts.routines.editRoutine')
                : t('workouts.routines.createRoutine')}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t('workouts.routines.editDescription')
                : t('workouts.routines.createDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="routine-name">
                {t('workouts.routines.name')} *
              </Label>
              <Input
                id="routine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('workouts.routines.namePlaceholder')}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="routine-description">
                {t('workouts.routines.descriptionLabel')} (optional)
              </Label>
              <Textarea
                id="routine-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('workouts.routines.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>
                  {t('workouts.routines.exercises')} ({exercises.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExerciseSelectorOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('workouts.routines.addExercise')}
                </Button>
              </div>

              {exercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                  <p>{t('workouts.routines.noExercises')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exercises.map((exercise, index) => (
                    <div key={index}>
                      {editingExerciseIndex === index ? (
                        <ExerciseEntryForm
                          entry={exercise}
                          onSave={(updated) =>
                            handleUpdateExercise(index, updated)
                          }
                          onCancel={() => setEditingExerciseIndex(null)}
                        />
                      ) : (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {exercise.exerciseName}
                                </h4>
                                {exercise.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {exercise.notes}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">
                                  {exercise.sets.length}{' '}
                                  {exercise.sets.length === 1
                                    ? t('workouts.routines.setCount')
                                    : t('workouts.routines.setsCount')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingExerciseIndex(index)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveExercise(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing
                ? t('workouts.routines.saveChanges')
                : t('workouts.routines.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise Selector */}
      <ExerciseSelectorDialog
        open={isExerciseSelectorOpen}
        onOpenChange={setIsExerciseSelectorOpen}
        onSelectExercise={handleAddExercise}
        userId={user?.uid || ''}
      />
    </>
  );
}

