import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import SetInput from './SetInput';
import type { ExerciseEntry, ExerciseSet } from '@/types/workout';

interface ExerciseEntryFormProps {
  entry: ExerciseEntry;
  onUpdate: (entry: ExerciseEntry) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export default function ExerciseEntryForm({
  entry,
  onUpdate,
  onRemove,
  showRemove = false,
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

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onUpdate({
      ...entry,
      notes: value,
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{entry.exerciseName}</h3>
        </div>
        {showRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

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
                onUpdate={(updatedSet) => handleUpdateSet(index, updatedSet)}
                onRemove={
                  entry.sets.length > 1 ? () => handleRemoveSet(index) : undefined
                }
                showRemove={entry.sets.length > 1}
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
    </Card>
  );
}

