import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Item } from '@/components/ui/item';
import type { WorkoutRoutine } from '@/types/workout';

interface RoutineSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routines: WorkoutRoutine[];
  selectedRoutineId: string;
  onSelectRoutine: (routineId: string) => void;
}

export default function RoutineSelectorDialog({
  open,
  onOpenChange,
  routines,
  selectedRoutineId,
  onSelectRoutine,
}: RoutineSelectorDialogProps) {
  const { t } = useTranslation();

  const handleSelectRoutine = (routineId: string) => {
    onSelectRoutine(routineId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('workouts.logWorkout.startFromRoutine')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-4">
            <Item
              variant="outline"
              className={`cursor-pointer transition-colors ${
                selectedRoutineId === 'none'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent'
              }`}
              onClick={() => handleSelectRoutine('none')}
            >
              <div className="flex flex-col gap-1">
                <div className="font-medium">
                  {t('workouts.logWorkout.startFromScratch')}
                </div>
              </div>
            </Item>
            {routines.map((routine) => (
              <Item
                key={routine.id}
                variant="outline"
                className={`cursor-pointer transition-colors ${
                  selectedRoutineId === routine.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleSelectRoutine(routine.id)}
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{routine.name}</div>
                  {routine.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {routine.description}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {routine.exercises.length}{' '}
                    {routine.exercises.length === 1
                      ? t('workouts.logWorkout.exercise', 'exercise')
                      : t('workouts.logWorkout.exercises', 'exercises')}
                  </div>
                </div>
              </Item>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
