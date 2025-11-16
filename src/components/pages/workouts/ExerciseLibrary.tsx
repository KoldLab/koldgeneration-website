import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, Loader2, Filter } from 'lucide-react';
import { getAllExercises } from '@/services/exerciseDBService';
import type { ExerciseDBExercise } from '@/types/workout';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseFilterStore } from '@/stores/exerciseFilterStore';
import ExerciseDetailsDialog from './components/ExerciseDetailsDialog';
import ExerciseGrid from './components/ExerciseGrid';
import ExerciseFilters from './components/ExerciseFilters';

export default function ExerciseLibrary() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseDBExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Get filter and display options from store
  const {
    searchQuery,
    selectedBodyPart,
    selectedEquipment,
    selectedTargetMuscle,
    columns,
    itemsPerPage,
    showGif,
    setDisplayOptions,
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
    const limit = Math.min(itemsPerPage, 100); // API max is 100
    const filterParams: any = {
      limit,
      offset: (currentPage - 1) * limit, // Calculate offset based on current page
      sortBy: 'name',
      sortOrder: 'asc',
    };
    if (selectedBodyPart !== 'all') filterParams.bodyParts = selectedBodyPart;
    if (selectedEquipment !== 'all')
      filterParams.equipments = selectedEquipment;
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
    itemsPerPage,
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
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance flex items-center gap-2">
          <Dumbbell className="h-8 w-8" />
          {t('workouts.exerciseLibrary.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 [&:not(:first-child)]:mt-6">
          {t('workouts.exerciseLibrary.description')}
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {t('workouts.exerciseLibrary.filters.title')}
          </h3>
        </div>

        {/* Search and Filters */}
        <ExerciseFilters />
      </Card>

      {/* Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
      </div>

      {/* Exercise Grid */}
      <ExerciseGrid
        exercises={filteredExercises}
        loading={loading}
        mode="view"
        onViewDetails={(exercise) => setSelectedExercise(exercise)}
        columns={columns}
        itemsPerPage={itemsPerPage}
        showGif={showGif}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showDisplayControls={true}
        onDisplayOptionsChange={(options) => {
          setDisplayOptions(options);
          setCurrentPage(1); // Reset to page 1 when options change
        }}
      />

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
