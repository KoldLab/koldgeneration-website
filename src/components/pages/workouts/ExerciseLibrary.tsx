import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dumbbell, Loader2, Search, X, Info, Filter } from 'lucide-react';
import { getAllExercises } from '@/services/exerciseDBService';
import type { ExerciseDBExercise } from '@/types/workout';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseFilterStore } from '@/stores/exerciseFilterStore';
import ExerciseDetailsDialog from './components/ExerciseDetailsDialog';

export default function ExerciseLibrary() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseDBExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedTargetMuscle, setSelectedTargetMuscle] =
    useState<string>('all');

  // Filter options from Zustand store
  const {
    bodyParts,
    muscles: targetMuscles,
    equipments: equipment,
    loadFilters,
  } = useExerciseFilterStore();

  // Selected exercise for details dialog
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseDBExercise | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExercises, setTotalExercises] = useState(0);

  // Load filter options from store
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Load exercises when filters change (memoized to prevent unnecessary re-renders)
  const loadExercises = useCallback(async () => {
    // Only show loading for exercises, not the whole page
    setLoading(true);
    setError('');

    // Build filter params from current filters
    // API expects: bodyParts, equipment, muscles (comma-separated, but we use single values)
    const limit = 20; // Show 20 exercises per page
    const filterParams: any = {
      limit,
      offset: (currentPage - 1) * limit, // Calculate offset based on current page
    };
    if (selectedBodyPart !== 'all') filterParams.bodyParts = selectedBodyPart;
    if (selectedEquipment !== 'all') filterParams.equipment = selectedEquipment;
    if (selectedTargetMuscle !== 'all')
      filterParams.muscles = selectedTargetMuscle;

    // Add search query if provided
    if (searchQuery.trim()) {
      filterParams.search = searchQuery.trim();
    }

    console.log('Loading exercises with filters:', filterParams);

    try {
      // Load only one page of exercises (20 exercises)
      const result = await getAllExercises(filterParams);

      if (result.exercises) {
        setExercises(result.exercises);
      }

      // Update pagination metadata
      if (result.metadata) {
        setTotalPages(result.metadata.totalPages || 1);
        setTotalExercises(result.metadata.totalExercises || 0);
        // Don't update currentPage here - it's controlled by user actions
      }

      console.log(
        `Loaded ${result.exercises?.length || 0} exercises (page ${
          result.metadata?.currentPage || 1
        } of ${result.metadata?.totalPages || 1})`
      );
    } catch (err: any) {
      setError(err.message || t('workouts.exerciseLibrary.error'));
      console.error('Failed to load exercises:', err);
    } finally {
      setLoading(false);
    }
  }, [
    selectedBodyPart,
    selectedEquipment,
    selectedTargetMuscle,
    searchQuery,
    currentPage,
    t,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBodyPart, selectedEquipment, selectedTargetMuscle, searchQuery]);

  // Load exercises when filters change
  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Exercises are already filtered by the API, no need for client-side filtering
  // Search is handled by the API search parameter
  const filteredExercises = useMemo(() => {
    return exercises;
  }, [exercises]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBodyPart('all');
    setSelectedEquipment('all');
    setSelectedTargetMuscle('all');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedBodyPart !== 'all' ||
    selectedEquipment !== 'all' ||
    selectedTargetMuscle !== 'all';

  if (error && exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={loadExercises} variant="outline">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Dumbbell className="h-8 w-8" />
          {t('workouts.exerciseLibrary.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('workouts.exerciseLibrary.description')}
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">
            {t('workouts.exerciseLibrary.filters.title')}
          </h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('workouts.exerciseLibrary.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t('workouts.exerciseLibrary.filters.bodyPart')}</Label>
            <Select
              value={selectedBodyPart}
              onValueChange={setSelectedBodyPart}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('workouts.exerciseLibrary.filters.all')}
                </SelectItem>
                {bodyParts.map((part: any, index: number) => {
                  const partValue = getStringValue(part);
                  return (
                    <SelectItem key={index} value={partValue}>
                      {partValue}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('workouts.exerciseLibrary.filters.equipment')}</Label>
            <Select
              value={selectedEquipment}
              onValueChange={setSelectedEquipment}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('workouts.exerciseLibrary.filters.all')}
                </SelectItem>
                {equipment.map((eq: any, index: number) => {
                  const eqValue = getStringValue(eq);
                  return (
                    <SelectItem key={index} value={eqValue}>
                      {eqValue}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('workouts.exerciseLibrary.filters.targetMuscle')}</Label>
            <Select
              value={selectedTargetMuscle}
              onValueChange={setSelectedTargetMuscle}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('workouts.exerciseLibrary.filters.all')}
                </SelectItem>
                {targetMuscles.map((muscle: any, index: number) => {
                  const muscleValue = getStringValue(muscle);
                  return (
                    <SelectItem key={index} value={muscleValue}>
                      {muscleValue}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            {t('workouts.exerciseLibrary.filters.clearFilters')}
          </Button>
        )}
      </Card>

      {/* Results Count and Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            <>
              Showing {filteredExercises.length} of {totalExercises}{' '}
              {totalExercises === 1 ? 'exercise' : 'exercises'}
              {totalPages > 1 && (
                <span className="ml-2">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </>
          )}
        </p>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Exercise Grid */}
      {loading && exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">
            {t('workouts.exerciseLibrary.loading')}
          </p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {t('workouts.exerciseLibrary.noResults')}
          </p>
        </Card>
      ) : (
        <div
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.exerciseId}
              exercise={exercise}
              onViewDetails={() => setSelectedExercise(exercise)}
            />
          ))}
        </div>
      )}

      {/* Exercise Details Dialog */}
      {selectedExercise && (
        <ExerciseDetailsDialog
          exercise={selectedExercise}
          open={!!selectedExercise}
          onOpenChange={(open) => !open && setSelectedExercise(null)}
          userId={user?.uid || ''}
        />
      )}
    </div>
  );
}

// Helper function to safely extract string value (handles both string and object with name property)
const getStringValue = (value: string | { name: string } | any): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'name' in value) return value.name;
  return String(value || '');
};

// Exercise Card Component
function ExerciseCard({
  exercise,
  onViewDetails,
}: {
  exercise: ExerciseDBExercise;
  onViewDetails: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="space-y-3">
        {/* Exercise GIF/Image/Placeholder */}
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
          {exercise.gifUrl ? (
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
                // Fallback to placeholder if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Dumbbell className="h-12 w-12 text-muted-foreground/50" />
          )}
        </div>

        {/* Exercise Name */}
        <h3 className="font-semibold text-lg line-clamp-2">{exercise.name}</h3>

        {/* Body Parts */}
        {exercise.bodyParts && exercise.bodyParts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {exercise.bodyParts.slice(0, 2).map((part: any, index: number) => {
              const partValue = getStringValue(part);
              return (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                >
                  {partValue}
                </span>
              );
            })}
            {exercise.bodyParts.length > 2 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{exercise.bodyParts.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Equipment */}
        {exercise.equipments && exercise.equipments.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Dumbbell className="h-4 w-4" />
            <span className="truncate">
              {exercise.equipments.map(getStringValue).join(', ')}
            </span>
          </div>
        )}

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
        >
          <Info className="h-4 w-4 mr-2" />
          {t('workouts.exerciseLibrary.exercise.viewDetails')}
        </Button>
      </div>
    </Card>
  );
}
