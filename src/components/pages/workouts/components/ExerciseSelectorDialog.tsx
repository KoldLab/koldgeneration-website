import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Heart } from 'lucide-react';
import {
  getAllExercises,
  getExerciseById as getExerciseDBById,
} from '@/services/exerciseDBService';
import {
  createExercise,
  getExercisesByUserId,
} from '@/services/workoutService';
import { useExerciseFilterStore } from '@/stores/exerciseFilterStore';
import { useExerciseFavoritesStore } from '@/stores/exerciseFavoritesStore';
import { useExerciseCacheStore } from '@/stores/exerciseCacheStore';
import { useAuth } from '@/contexts/AuthContext';
import ExerciseGrid from './ExerciseGrid';
import ExerciseDetailsDialog from './ExerciseDetailsDialog';
import ExerciseFilters from './ExerciseFilters';
import type {
  ExerciseDBExercise,
  ExerciseEntry,
  Exercise,
} from '@/types/workout';

interface ExerciseSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (entry: ExerciseEntry) => void;
  userId: string;
  closeOnSelect?: boolean; // If true, closes dialog after selecting an exercise (default: true)
  existingExercises?: ExerciseEntry[]; // Exercises already added (for showing indicators)
}

export default function ExerciseSelectorDialog({
  open,
  onOpenChange,
  onSelectExercise,
  userId,
  closeOnSelect = true,
  existingExercises = [],
}: ExerciseSelectorDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'browse' | 'favorites' | 'myExercises' | 'create'
  >('browse');

  // Browse tab state
  const [exercises, setExercises] = useState<ExerciseDBExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Favorites tab state
  const [favoriteExercises, setFavoriteExercises] = useState<
    ExerciseDBExercise[]
  >([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // My Exercises tab state
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

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

  // Create tab state
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected exercise for details dialog
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseDBExercise | null>(null);

  // Favorites and cache stores
  const {
    favoriteExerciseDBIds,
    isFavoriteCustom,
    isFavoriteExerciseDB,
    toggleFavoriteCustom,
    initialize: initializeFavorites,
    initialized: favoritesInitialized,
  } = useExerciseFavoritesStore();
  const { getExercise: getCachedExercise } = useExerciseCacheStore();

  // Initialize favorites when dialog opens and user is available
  useEffect(() => {
    if (open && user?.uid && !favoritesInitialized) {
      initializeFavorites(user.uid);
    }
  }, [open, user?.uid, favoritesInitialized, initializeFavorites]);

  // Load filter options
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Load exercises
  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const limit = Math.min(itemsPerPage, 100); // API max is 100, but we cap at 100
      const filterParams: any = {
        limit,
        offset: (currentPage - 1) * limit,
        sortBy: 'name', // Default sort by name
        sortOrder: 'asc', // Default ascending order
      };

      // Add filters (API supports comma-separated values for multiple selections)
      if (selectedBodyPart !== 'all') filterParams.bodyParts = selectedBodyPart;
      if (selectedEquipment !== 'all')
        filterParams.equipments = selectedEquipment; // Use 'equipments' (plural) as per API
      if (selectedTargetMuscle !== 'all')
        filterParams.muscles = selectedTargetMuscle;

      // Advanced search - supports fuzzy matching and more
      if (searchQuery.trim()) filterParams.search = searchQuery.trim();

      const result = await getAllExercises(filterParams);
      if (result.exercises) {
        setExercises(result.exercises);
      }
      if (result.metadata) {
        setTotalPages(result.metadata.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
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
  ]);

  useEffect(() => {
    if (open && activeTab === 'browse') {
      loadExercises();
    }
  }, [open, activeTab, loadExercises]);

  useEffect(() => {
    if (activeTab === 'browse') {
      setCurrentPage(1);
    }
  }, [selectedBodyPart, selectedEquipment, selectedTargetMuscle, searchQuery]);

  // Load favorite exercises
  const loadFavorites = useCallback(async () => {
    if (favoriteExerciseDBIds.length === 0) {
      setFavoriteExercises([]);
      return;
    }

    setLoadingFavorites(true);
    try {
      const favoriteExercisesList: ExerciseDBExercise[] = [];

      // Try to get from cache first, then fetch from API
      for (const exerciseDBId of favoriteExerciseDBIds) {
        const cached = getCachedExercise(exerciseDBId);
        if (cached) {
          favoriteExercisesList.push(cached);
        } else {
          try {
            const exercise = await getExerciseDBById(exerciseDBId);
            favoriteExercisesList.push(exercise);
          } catch (err) {
            console.warn(
              `Failed to load favorite exercise ${exerciseDBId}:`,
              err
            );
          }
        }
      }

      setFavoriteExercises(favoriteExercisesList);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [favoriteExerciseDBIds, getCachedExercise]);

  // Load custom exercises
  const loadCustomExercises = useCallback(async () => {
    if (!user?.uid) {
      setCustomExercises([]);
      return;
    }

    setLoadingCustom(true);
    try {
      const exercises = await getExercisesByUserId(user.uid);
      setCustomExercises(exercises);
    } catch (error) {
      console.error('Error loading custom exercises:', error);
    } finally {
      setLoadingCustom(false);
    }
  }, [user?.uid]);

  // Load data when tab changes
  useEffect(() => {
    if (open) {
      if (activeTab === 'favorites') {
        loadFavorites();
      } else if (activeTab === 'myExercises') {
        loadCustomExercises();
      }
    }
  }, [open, activeTab, loadFavorites, loadCustomExercises]);

  // Reload favorites when favoriteExerciseDBIds changes
  useEffect(() => {
    if (open && activeTab === 'favorites') {
      loadFavorites();
    }
  }, [favoriteExerciseDBIds, open, activeTab, loadFavorites]);

  const handleSelectExercise = (entry: ExerciseEntry) => {
    onSelectExercise(entry);
    if (closeOnSelect) {
      onOpenChange(false);
    }
  };

  const handleSelectCustomExercise = (exercise: Exercise) => {
    const entry: ExerciseEntry = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [],
      notes: '',
    };
    onSelectExercise(entry);
    if (closeOnSelect) {
      onOpenChange(false);
    }
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) {
      return;
    }

    setCreating(true);
    try {
      const newExercise = await createExercise(userId, {
        name: customName.trim(),
        description: customDescription.trim() || undefined,
        source: 'custom',
      });

      const entry: ExerciseEntry = {
        exerciseId: newExercise.id,
        exerciseName: newExercise.name,
        sets: [],
        notes: '',
      };
      onSelectExercise(entry);
      if (closeOnSelect) {
        onOpenChange(false);
      }

      // Reset form and reload custom exercises
      setCustomName('');
      setCustomDescription('');
      loadCustomExercises();
    } catch (error) {
      console.error('Error creating exercise:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" mb-8 flex h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] min-w-[calc(100vw-2rem)] sm:min-w-[600px] max-w-[calc(100vw-2rem)] sm:max-w-7xl flex-col justify-between gap-0 p-0">
        <ScrollArea className="pt-3 flex flex-col justify-between overflow-hidden">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-4 sm:px-6 pt-4 sm:pt-6">
              {t('workouts.exerciseSelector.title')}
            </DialogTitle>

            <div className="px-4 sm:px-6 py-4 space-y-4">
              <Select
                value={activeTab}
                onValueChange={(v) =>
                  setActiveTab(
                    v as 'browse' | 'favorites' | 'myExercises' | 'create'
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="browse">
                    {t('workouts.exerciseSelector.browse')}
                  </SelectItem>
                  <SelectItem value="favorites">
                    {t('workouts.exerciseSelector.favorites')}
                  </SelectItem>
                  <SelectItem value="myExercises">
                    {t('workouts.exerciseSelector.myExercises')}
                  </SelectItem>
                  <SelectItem value="create">
                    {t('workouts.exerciseSelector.create')}
                  </SelectItem>
                </SelectContent>
              </Select>

              {activeTab === 'browse' && (
                <div className="mt-4">
                  <div className="space-y-4">
                    {/* Search and Filters */}
                    <ExerciseFilters />
                  </div>

                  {/* Exercise Grid */}
                  <div className="py-4">
                    <ExerciseGrid
                      exercises={useMemo(() => {
                        // Sort: favorites first, then alphabetically
                        const sorted = [...exercises].sort((a, b) => {
                          const aIsFavorite = isFavoriteExerciseDB(
                            a.exerciseId
                          );
                          const bIsFavorite = isFavoriteExerciseDB(
                            b.exerciseId
                          );

                          if (aIsFavorite && !bIsFavorite) return -1;
                          if (!aIsFavorite && bIsFavorite) return 1;

                          // Both are favorites or both are not - sort alphabetically
                          return a.name.localeCompare(b.name);
                        });
                        return sorted;
                      }, [exercises, isFavoriteExerciseDB])}
                      loading={loading}
                      mode="select"
                      onSelectExercise={handleSelectExercise}
                      onViewDetails={(exercise) =>
                        setSelectedExercise(exercise)
                      }
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
                      existingExercises={existingExercises}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="mt-4">
                  <div className="px-4 sm:px-6 py-4">
                    {loadingFavorites ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : favoriteExercises.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-muted-foreground">
                          {t('workouts.exerciseSelector.noFavorites')}
                        </p>
                      </div>
                    ) : (
                      <ExerciseGrid
                        exercises={favoriteExercises}
                        loading={false}
                        mode="select"
                        onSelectExercise={handleSelectExercise}
                        onViewDetails={(exercise) =>
                          setSelectedExercise(exercise)
                        }
                        columns={columns}
                        itemsPerPage={itemsPerPage}
                        showGif={showGif}
                        existingExercises={existingExercises}
                        currentPage={1}
                        totalPages={1}
                        onPageChange={() => {}}
                        showDisplayControls={false}
                      />
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'myExercises' && (
                <div className="mt-4">
                  <div className="px-4 sm:px-6 py-4">
                    {loadingCustom ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : customExercises.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-muted-foreground">
                          {t('workouts.exerciseSelector.noCustomExercises')}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`grid gap-4 ${columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}
                      >
                        {customExercises.map((exercise) => (
                          <CustomExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            onSelect={() =>
                              handleSelectCustomExercise(exercise)
                            }
                            isFavorite={isFavoriteCustom(exercise.id)}
                            onToggleFavorite={async () => {
                              if (user?.uid) {
                                await toggleFavoriteCustom(
                                  user.uid,
                                  exercise.id
                                );
                              }
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'create' && (
                <div className="mt-4">
                  <div className="px-4 sm:px-6 py-4">
                    <Card className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto">
                      <div className="space-y-2">
                        <Label htmlFor="custom-name">
                          {t('workouts.exerciseSelector.customName')} *
                        </Label>
                        <Input
                          id="custom-name"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder={t(
                            'workouts.exerciseSelector.customNamePlaceholder'
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-description">
                          {t('workouts.exerciseSelector.customDescription')}{' '}
                          (optional)
                        </Label>
                        <Textarea
                          id="custom-description"
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          placeholder={t(
                            'workouts.exerciseSelector.customDescriptionPlaceholder'
                          )}
                          rows={4}
                        />
                      </div>

                      <Button
                        onClick={handleCreateCustom}
                        disabled={!customName.trim() || creating}
                        className="w-full"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('workouts.exerciseSelector.creating')}
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('workouts.exerciseSelector.createExercise')}
                          </>
                        )}
                      </Button>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>
        </ScrollArea>

        <DialogFooter className="p-3 sm:px-6 sm:pb-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline">
              {closeOnSelect ? t('common.cancel') : t('common.close')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      {/* Exercise Details Dialog */}
      {selectedExercise && (
        <ExerciseDetailsDialog
          exercise={selectedExercise}
          open={!!selectedExercise}
          onOpenChange={(open) => !open && setSelectedExercise(null)}
        />
      )}
    </Dialog>
  );
}

// Custom Exercise Card Component
function CustomExerciseCard({
  exercise,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: {
  exercise: Exercise;
  onSelect: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden relative">
      {/* Favorite Button - Top Right */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          await onToggleFavorite();
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors shadow-sm"
        aria-label={
          isFavorite
            ? t('workouts.exerciseGrid.removeFavorite')
            : t('workouts.exerciseGrid.addFavorite')
        }
      >
        <Heart
          className={`h-4 w-4 ${
            isFavorite
              ? 'fill-red-500 text-red-500'
              : 'text-muted-foreground hover:text-red-500'
          } transition-colors`}
        />
      </button>

      <CardHeader className="pt-6">
        <CardTitle className="line-clamp-2">{exercise.name}</CardTitle>
        {exercise.description && (
          <CardDescription className="line-clamp-2">
            {exercise.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="flex-col gap-2">
        <Button
          variant="default"
          className="w-full text-sm"
          size="sm"
          onClick={onSelect}
        >
          <Plus className="h-4 w-4 mr-1.5 shrink-0" />
          <span className="truncate">
            {t('workouts.exerciseGrid.addToWorkout')}
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}
