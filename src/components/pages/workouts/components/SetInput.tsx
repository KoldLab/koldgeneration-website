import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ExerciseSet } from '@/types/workout';

interface SetInputProps {
  set: ExerciseSet;
  setNumber: number;
  onUpdate: (set: ExerciseSet) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export default function SetInput({
  set,
  setNumber,
  onUpdate,
  onRemove,
  showRemove = false,
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
    <div className="flex items-center gap-4 p-3 border rounded-md">
      <div className="flex-shrink-0 w-8 text-sm font-medium text-muted-foreground">
        {setNumber}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor={`reps-${setNumber}`} className="text-xs">
            Reps
          </Label>
          <Input
            id={`reps-${setNumber}`}
            type="number"
            min="0"
            value={set.reps ?? ''}
            onChange={(e) => handleRepsChange(e.target.value)}
            placeholder="0"
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`weight-${setNumber}`} className="text-xs">
            Weight
          </Label>
          <Input
            id={`weight-${setNumber}`}
            type="number"
            min="0"
            step="0.5"
            value={set.weight ?? ''}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="0"
            className="h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Switch
            id={`completed-${setNumber}`}
            checked={set.completed}
            onCheckedChange={handleCompletedChange}
          />
          <Label htmlFor={`completed-${setNumber}`} className="text-xs cursor-pointer">
            Done
          </Label>
        </div>

        {showRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

