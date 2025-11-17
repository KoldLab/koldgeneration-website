import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dumbbell, PersonStanding } from 'lucide-react';
import type { ExerciseDBExercise } from '@/types/workout';
import { useExerciseCacheStore } from '@/stores/exerciseCacheStore';

// Helper function to safely extract string value (handles both string and object with name property)
const getStringValue = (value: string | { name: string } | any): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'name' in value) return value.name;
  return String(value || '');
};

interface ExerciseDetailsDialogProps {
  exercise: ExerciseDBExercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExerciseDetailsDialog({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailsDialogProps) {
  const { t } = useTranslation();
  const { setExercise: cacheExercise } = useExerciseCacheStore();

  // Cache the exercise when dialog opens
  useEffect(() => {
    if (open && exercise) {
      cacheExercise(exercise);
    }
  }, [open, exercise, cacheExercise]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0">
          <DialogTitle className="text-2xl">{exercise.name}</DialogTitle>
          <DialogDescription>
            {exercise.overview ||
              t('workouts.exerciseLibrary.exercise.overview')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 px-4 sm:px-6">
          <div className="space-y-6">
            {/* Exercise GIF/Image/Video */}
            {(exercise.gifUrl || exercise.imageUrl || exercise.videoUrl) && (
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                {exercise.videoUrl ? (
                  <video
                    src={exercise.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : exercise.gifUrl ? (
                  <img
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to imageUrl if GIF fails
                      if (exercise.imageUrl) {
                        e.currentTarget.src = exercise.imageUrl;
                      } else {
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                  />
                ) : exercise.imageUrl ? (
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
            )}

            {/* Body Parts & Equipment Group */}
            {(exercise.bodyParts?.length > 0 ||
              exercise.equipments?.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Body Parts */}
                {exercise.bodyParts && exercise.bodyParts.length > 0 && (
                  <div>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                      <PersonStanding className="h-4 w-4" />
                      {t('workouts.exerciseLibrary.exercise.bodyParts')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {exercise.bodyParts.map((part: any, index: number) => {
                        const partValue = getStringValue(part);
                        return (
                          <Badge key={index} variant="default">
                            {partValue}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {exercise.equipments && exercise.equipments.length > 0 && (
                  <div>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      {t('workouts.exerciseLibrary.exercise.equipment')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {exercise.equipments.map((eq: any, index: number) => {
                        const eqValue = getStringValue(eq);
                        return (
                          <Badge key={index} variant="secondary">
                            {eqValue}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Muscles Group - Target and Secondary together */}
            {(exercise.targetMuscles?.length > 0 ||
              exercise.secondaryMuscles?.length > 0) && (
              <div>
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
                  Muscles
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Target Muscles */}
                  {exercise.targetMuscles &&
                    exercise.targetMuscles.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                          {t('workouts.exerciseLibrary.exercise.targetMuscles')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {exercise.targetMuscles.map(
                            (muscle: any, index: number) => {
                              const muscleValue = getStringValue(muscle);
                              return (
                                <Badge key={index} variant="outline">
                                  {muscleValue}
                                </Badge>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                  {/* Secondary Muscles */}
                  {exercise.secondaryMuscles &&
                    exercise.secondaryMuscles.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                          {t(
                            'workouts.exerciseLibrary.exercise.secondaryMuscles'
                          )}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {exercise.secondaryMuscles.map(
                            (muscle: any, index: number) => {
                              const muscleValue = getStringValue(muscle);
                              return (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="bg-secondary/50"
                                >
                                  {muscleValue}
                                </Badge>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            <Separator />

            {/* Instructions */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <div>
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
                  {t('workouts.exerciseLibrary.exercise.instructions')}
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={index} className="pl-2">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tips */}
            {exercise.exerciseTips && exercise.exerciseTips.length > 0 && (
              <div>
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
                  {t('workouts.exerciseLibrary.exercise.tips')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {exercise.exerciseTips.map((tip, index) => (
                    <li key={index} className="pl-2">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variations */}
            {exercise.variations && exercise.variations.length > 0 && (
              <div>
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
                  {t('workouts.exerciseLibrary.exercise.variations')}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {exercise.variations.map((variation, index) => (
                    <li key={index} className="pl-2">
                      {variation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Keywords */}
            {exercise.keywords && exercise.keywords.length > 0 && (
              <div>
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-2">
                  Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.keywords.slice(0, 10).map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {exercise.keywords.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{exercise.keywords.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
