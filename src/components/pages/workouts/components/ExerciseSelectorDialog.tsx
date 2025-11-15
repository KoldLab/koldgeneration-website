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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, X, Dumbbell, Plus } from 'lucide-react';
import { getAllExercises } from '@/services/exerciseDBService';
import { createExercise } from '@/services/workoutService';
import { useExerciseFilterStore } from '@/stores/exerciseFilterStore';
import type { ExerciseDBExercise, ExerciseEntry } from '@/types/workout';

interface ExerciseSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (entry: ExerciseEntry) => void;
  userId: string;
}

export default function ExerciseSelectorDialog({
  open,
  onOpenChange,
  onSelectExercise,
  userId,
}: ExerciseSelectorDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');

  // Browse tab state
  const [exercises, setExercises] = useState<ExerciseDBExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedTargetMuscle, setSelectedTargetMuscle] =
    useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create tab state
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Filter options
  const {
    bodyParts,
    muscles: targetMuscles,
    equipments: equipment,
    loadFilters,
  } = useExerciseFilterStore();

  // Load filter options
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Load exercises
  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const limit = 20;
      const filterParams: any = {
        limit,
        offset: (currentPage - 1) * limit,
      };
      if (selectedBodyPart !== 'all') filterParams.bodyParts = selectedBodyPart;
      if (selectedEquipment !== 'all')
        filterParams.equipment = selectedEquipment;
      if (selectedTargetMuscle !== 'all')
        filterParams.muscles = selectedTargetMuscle;
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

  const handleSelectExerciseDB = (exercise: ExerciseDBExercise) => {
    const entry: ExerciseEntry = {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      sets: [],
      notes: '',
    };
    onSelectExercise(entry);
    onOpenChange(false);
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
      onOpenChange(false);

      // Reset form
      setCustomName('');
      setCustomDescription('');
    } catch (error) {
      console.error('Error creating exercise:', error);
    } finally {
      setCreating(false);
    }
  };

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

  const getStringValue = (value: string | { name: string } | any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'name' in value)
      return value.name;
    return String(value || '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mb-8 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-0">
        <ScrollArea className="flex flex-col justify-between overflow-hidden">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-6 pt-6">
              {t('workouts.exerciseSelector.title')}
            </DialogTitle>

            <div className="px-6 pt-4 pb-4">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as 'browse' | 'create')}
                className="w-full"
              >
                <TabsList>
                  <TabsTrigger value="browse">
                    {t('workouts.exerciseSelector.browse')}
                  </TabsTrigger>
                  <TabsTrigger value="create">
                    {t('workouts.exerciseSelector.create')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="mt-4">
                  <div className="px-6 space-y-4">
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

                    {/* Filters */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>
                          {t('workouts.exerciseLibrary.filters.bodyPart')}
                        </Label>
                        <Select
                          value={selectedBodyPart}
                          onValueChange={setSelectedBodyPart}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {t('workouts.exerciseLibrary.filters.all')}
                            </SelectItem>
                            {bodyParts.map((part: any, index: number) => (
                              <SelectItem
                                key={index}
                                value={getStringValue(part)}
                              >
                                {getStringValue(part)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {t('workouts.exerciseLibrary.filters.equipment')}
                        </Label>
                        <Select
                          value={selectedEquipment}
                          onValueChange={setSelectedEquipment}
                        >
                          <SelectTrigger className="w-full">
                          <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {t('workouts.exerciseLibrary.filters.all')}
                            </SelectItem>
                            {equipment.map((eq: any, index: number) => (
                              <SelectItem
                                key={index}
                                value={getStringValue(eq)}
                              >
                                {getStringValue(eq)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {t('workouts.exerciseLibrary.filters.targetMuscle')}
                        </Label>
                        <Select
                          value={selectedTargetMuscle}
                          onValueChange={setSelectedTargetMuscle}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {t('workouts.exerciseLibrary.filters.all')}
                            </SelectItem>
                            {targetMuscles.map((muscle: any, index: number) => (
                              <SelectItem
                                key={index}
                                value={getStringValue(muscle)}
                              >
                                {getStringValue(muscle)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t('workouts.exerciseLibrary.filters.clearFilters')}
                      </Button>
                    )}
                  </div>

                  {/* Exercise Grid */}
                  <div className="px-6 py-4">
                    {loading && exercises.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : exercises.length === 0 ? (
                      <Card className="p-12 text-center">
                        <p className="text-muted-foreground">
                          {t('workouts.exerciseLibrary.noResults')}
                        </p>
                      </Card>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {exercises.map((exercise) => (
                          <Card
                            key={exercise.exerciseId}
                            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleSelectExerciseDB(exercise)}
                          >
                            <div className="space-y-3">
                              <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
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
                              <h3 className="font-semibold line-clamp-2">
                                {exercise.name}
                              </h3>
                              {exercise.bodyParts &&
                                exercise.bodyParts.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {exercise.bodyParts
                                      .slice(0, 2)
                                      .map((part: any, index: number) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                                        >
                                          {getStringValue(part)}
                                        </span>
                                      ))}
                                  </div>
                                )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
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
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="create" className="mt-4">
                  <div className="px-6 py-4">
                    <Card className="p-6 space-y-4 max-w-2xl mx-auto">
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
                </TabsContent>
              </Tabs>
            </div>
          </DialogHeader>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline">{t('common.cancel')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
