import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Plus } from 'lucide-react';
import { getAllExercises } from '@/services/exerciseDBService';
import { createExercise } from '@/services/workoutService';
import { useExerciseFilterStore } from '@/stores/exerciseFilterStore';
import ExerciseGrid from './ExerciseGrid';
import ExerciseDetailsDialog from './ExerciseDetailsDialog';
import ExerciseFilters from './ExerciseFilters';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const handleSelectExercise = (entry: ExerciseEntry) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mb-8 flex h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] min-w-[calc(100vw-2rem)] sm:min-w-[600px] max-w-[calc(100vw-2rem)] sm:max-w-4xl flex-col justify-between gap-0 p-0">
        <ScrollArea className="flex flex-col justify-between overflow-hidden">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-4 sm:px-6 pt-4 sm:pt-6">
              {t('workouts.exerciseSelector.title')}
            </DialogTitle>

            <div className="px-4 sm:px-6 pt-4 pb-4">
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
                    {/* Search and Filters */}
                    <ExerciseFilters />
                  </div>

                  {/* Exercise Grid */}
                  <div className="px-4 sm:px-6 py-4">
                    <ExerciseGrid
                      exercises={exercises}
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
                    />
                  </div>
                </TabsContent>

                <TabsContent value="create" className="mt-4">
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
                </TabsContent>
              </Tabs>
            </div>
          </DialogHeader>
        </ScrollArea>

        <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline">{t('common.cancel')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      {/* Exercise Details Dialog */}
      {selectedExercise && (
        <ExerciseDetailsDialog
          exercise={selectedExercise}
          open={!!selectedExercise}
          onOpenChange={(open) => !open && setSelectedExercise(null)}
          userId={userId}
        />
      )}
    </Dialog>
  );
}
