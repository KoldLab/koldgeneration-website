import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Dumbbell, Info, Plus } from 'lucide-react';
import type { ExerciseDBExercise, ExerciseEntry } from '@/types/workout';

interface ExerciseGridProps {
  exercises: ExerciseDBExercise[];
  loading: boolean;
  mode: 'view' | 'select'; // 'view' for ExerciseLibrary, 'select' for ExerciseSelectorDialog
  onViewDetails?: (exercise: ExerciseDBExercise) => void;
  onSelectExercise?: (entry: ExerciseEntry) => void;
  // Display options
  columns?: number; // 2, 3, 4, or 5
  itemsPerPage?: number; // 10-100
  showGif?: boolean; // Show/hide GIFs
  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Display controls visibility
  showDisplayControls?: boolean;
  onDisplayOptionsChange?: (options: {
    columns: number;
    itemsPerPage: number;
    showGif: boolean;
  }) => void;
}

// Helper function to safely extract string value
const getStringValue = (value: string | { name: string } | any): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'name' in value) return value.name;
  return String(value || '');
};

export default function ExerciseGrid({
  exercises,
  loading,
  mode,
  onViewDetails,
  onSelectExercise,
  columns: initialColumns = 3,
  itemsPerPage: initialItemsPerPage = 25,
  showGif: initialShowGif = true,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showDisplayControls = true,
  onDisplayOptionsChange,
}: ExerciseGridProps) {
  const { t } = useTranslation();
  const [columns, setColumns] = useState(initialColumns);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [showGif, setShowGif] = useState(initialShowGif);

  const handleColumnsChange = (value: string) => {
    const newColumns = parseInt(value, 10);
    setColumns(newColumns);
    onDisplayOptionsChange?.({
      columns: newColumns,
      itemsPerPage,
      showGif,
    });
  };

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    setItemsPerPage(newItemsPerPage);
    onDisplayOptionsChange?.({
      columns,
      itemsPerPage: newItemsPerPage,
      showGif,
    });
  };

  const handleShowGifChange = (value: string) => {
    const newShowGif = value === 'true';
    setShowGif(newShowGif);
    onDisplayOptionsChange?.({
      columns,
      itemsPerPage,
      showGif: newShowGif,
    });
  };

  // Grid column classes based on columns prop
  const gridColsClass =
    {
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    }[columns] || 'sm:grid-cols-2 lg:grid-cols-3';

  if (loading && exercises.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">
          {t('workouts.exerciseLibrary.noResults')}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Display Controls */}
      {showDisplayControls && (
        <Card className="p-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('workouts.exerciseGrid.columns')}</Label>
              <Select
                value={columns.toString()}
                onValueChange={handleColumnsChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">
                    2 {t('workouts.exerciseGrid.columnsLabel')}
                  </SelectItem>
                  <SelectItem value="3">
                    3 {t('workouts.exerciseGrid.columnsLabel')}
                  </SelectItem>
                  <SelectItem value="4">
                    4 {t('workouts.exerciseGrid.columnsLabel')}
                  </SelectItem>
                  <SelectItem value="5">
                    5 {t('workouts.exerciseGrid.columnsLabel')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('workouts.exerciseGrid.itemsPerPage')}</Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('workouts.exerciseGrid.showGif')}</Label>
              <Select
                value={showGif.toString()}
                onValueChange={handleShowGifChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('common.yes')}</SelectItem>
                  <SelectItem value="false">{t('common.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* Exercise Grid */}
      <div className={`grid gap-4 ${gridColsClass}`}>
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.exerciseId}
            exercise={exercise}
            mode={mode}
            showGif={showGif}
            onViewDetails={onViewDetails}
            onSelectExercise={onSelectExercise}
          />
        ))}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  mode,
  showGif,
  onViewDetails,
  onSelectExercise,
}: {
  exercise: ExerciseDBExercise;
  mode: 'view' | 'select';
  showGif: boolean;
  onViewDetails?: (exercise: ExerciseDBExercise) => void;
  onSelectExercise?: (entry: ExerciseEntry) => void;
}) {
  const { t } = useTranslation();

  const handleSelect = () => {
    if (onSelectExercise) {
      const entry: ExerciseEntry = {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        sets: [],
        notes: '',
      };
      onSelectExercise(entry);
    }
  };

  const handleViewDetails = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (onViewDetails) {
      onViewDetails(exercise);
    }
  };

  // Get description from body parts or equipment
  const getDescription = () => {
    const parts =
      exercise.bodyParts?.slice(0, 2).map(getStringValue).join(', ') || '';
    const equipment =
      exercise.equipments?.slice(0, 1).map(getStringValue).join(', ') || '';
    if (parts && equipment) {
      return `${parts} • ${equipment}`;
    }
    return parts || equipment || '';
  };

  return (
    <Card
      className={`${showGif ? 'pt-0' : ''} hover:shadow-lg transition-shadow overflow-hidden`}
    >
      {/* Exercise GIF/Image/Placeholder */}
      {showGif && (
        <CardContent className="px-0">
          <div className="aspect-video rounded-t-xl bg-muted flex items-center justify-center overflow-hidden">
            {exercise.gifUrl ? (
              <img
                src={exercise.gifUrl}
                alt={exercise.name}
                className="w-full h-full object-cover"
                onError={(e) => {
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
              />
            ) : (
              <Dumbbell className="h-12 w-12 text-muted-foreground/50" />
            )}
          </div>
        </CardContent>
      )}

      <CardHeader className={showGif ? '' : 'pt-6'}>
        <CardTitle className="line-clamp-2">{exercise.name}</CardTitle>
        {getDescription() && (
          <CardDescription className="line-clamp-2">
            {getDescription()}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="flex-col gap-2">
        {mode === 'select' && onSelectExercise && (
          <Button
            variant="default"
            className="w-full text-sm"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect();
            }}
          >
            <Plus className="h-4 w-4 mr-1.5 shrink-0" />
            <span className="truncate">
              {t('workouts.exerciseGrid.addToWorkout')}
            </span>
          </Button>
        )}

        {onViewDetails && (
          <Button
            variant={mode === 'select' ? 'outline' : 'default'}
            className="w-full text-sm"
            size="sm"
            onClick={handleViewDetails}
          >
            <Info className="h-4 w-4 mr-1.5 shrink-0" />
            <span className="truncate">
              {t('workouts.exerciseLibrary.exercise.viewDetails')}
            </span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
