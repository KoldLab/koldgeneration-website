import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import SetInput from './SetInput';
import type { ExerciseEntry, ExerciseSet } from '@/types/workout';

interface ExerciseEntryFormProps {
  entry: ExerciseEntry;
  onUpdate: (entry: ExerciseEntry) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function ExerciseEntryForm({
  entry,
  onUpdate,
  onRemove,
  showRemove = false,
  isCollapsed = false,
  onCollapsedChange,
}: ExerciseEntryFormProps) {
  const [notes, setNotes] = useState(entry.notes || '');

  const handleAddSet = () => {
    const newSetNumber = entry.sets.length + 1;
    const newSet: ExerciseSet = {
      setNumber: newSetNumber,
      completed: false,
    };
    onUpdate({
      ...entry,
      sets: [...entry.sets, newSet],
    });
  };

  const handleUpdateSet = (index: number, updatedSet: ExerciseSet) => {
    const updatedSets = [...entry.sets];
    updatedSets[index] = updatedSet;
    onUpdate({
      ...entry,
      sets: updatedSets,
    });
  };

  const handleRemoveSet = (index: number) => {
    const updatedSets = entry.sets.filter((_, i) => i !== index);
    // Renumber sets
    const renumberedSets = updatedSets.map((set, i) => ({
      ...set,
      setNumber: i + 1,
    }));
    onUpdate({
      ...entry,
      sets: renumberedSets,
    });
  };

  const handleDuplicateSet = (index: number) => {
    const setToDuplicate = entry.sets[index];
    const newSet: ExerciseSet = {
      setNumber: entry.sets.length + 1,
      reps: setToDuplicate.reps,
      weight: setToDuplicate.weight,
      completed: false, // New set is not completed
    };
    onUpdate({
      ...entry,
      sets: [...entry.sets, newSet],
    });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onUpdate({
      ...entry,
      notes: value,
    });
  };

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) => onCollapsedChange?.(!open)}
    >
      <Card className="p-4">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between w-full cursor-pointer">
            <h3 className="font-semibold text-lg">{entry.exerciseName}</h3>
            <div className="flex items-center gap-2">
              {onCollapsedChange && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCollapsedChange(!isCollapsed);
                  }}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              )}
              {showRemove && onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sets</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSet}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Set
              </Button>
            </div>

            {entry.sets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No sets added yet. Click "Add Set" to start logging.
              </p>
            ) : (
              <div className="space-y-2">
                {entry.sets.map((set, index) => (
                  <SetInput
                    key={index}
                    set={set}
                    setNumber={set.setNumber}
                    onUpdate={(updatedSet) =>
                      handleUpdateSet(index, updatedSet)
                    }
                    onRemove={() => handleRemoveSet(index)}
                    onDuplicate={() => handleDuplicateSet(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`notes-${entry.exerciseId}`} className="text-sm">
              Exercise Notes (optional)
            </Label>
            <Textarea
              id={`notes-${entry.exerciseId}`}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add any notes about this exercise..."
              rows={2}
            />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
