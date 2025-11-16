import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExerciseSet } from '@/types/workout';

interface SetInputProps {
  set: ExerciseSet;
  setNumber: number;
  onUpdate: (set: ExerciseSet) => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
}

export default function SetInput({
  set,
  setNumber,
  onUpdate,
  onRemove,
  onDuplicate,
}: SetInputProps) {
  const handleRepsChange = (value: string) => {
    const reps = value === '' ? undefined : parseInt(value, 10);
    onUpdate({ ...set, reps: isNaN(reps!) ? undefined : reps });
  };

  const handleWeightChange = (value: string) => {
    const weight = value === '' ? undefined : parseFloat(value);
    onUpdate({ ...set, weight: isNaN(weight!) ? undefined : weight });
  };

  const handleCompletedChange = (checked: boolean) => {
    onUpdate({ ...set, completed: checked });
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-md">
      <div className="flex-shrink-0 w-8 text-sm font-medium text-muted-foreground">
        {setNumber}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3">
        <Input
          id={`reps-${setNumber}`}
          type="number"
          min="0"
          value={set.reps ?? ''}
          onChange={(e) => handleRepsChange(e.target.value)}
          placeholder="Reps"
          className="h-9"
        />

        <Input
          id={`weight-${setNumber}`}
          type="number"
          min="0"
          step="0.5"
          value={set.weight ?? ''}
          onChange={(e) => handleWeightChange(e.target.value)}
          placeholder="Weight"
          className="h-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`completed-${setNumber}`}
            checked={set.completed}
            onCheckedChange={handleCompletedChange}
            className={cn(
              'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white'
            )}
          />
          <Label
            htmlFor={`completed-${setNumber}`}
            className="text-xs cursor-pointer"
          >
            Done
          </Label>
        </div>

        {onDuplicate && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDuplicate}
            className="h-8 w-8"
            title="Duplicate set"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}

        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Delete set"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
