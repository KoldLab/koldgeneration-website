import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Search, X, Heart } from 'lucide-react';
import { useExerciseFilterStore } from '@/stores/exerciseFilterStore';
import { Checkbox } from '@/components/ui/checkbox';
import {
  translateBodyPart,
  translateEquipment,
  translateMuscle,
} from '@/utils/exerciseTranslations';

interface ExerciseFiltersProps {
  onFiltersChange?: (filters: {
    searchQuery: string;
    bodyPart: string;
    equipment: string;
    targetMuscle: string;
    showFavoritesOnly: boolean;
  }) => void;
  showResetButton?: boolean;
}

export default function ExerciseFilters({
  onFiltersChange,
  showResetButton = true,
}: ExerciseFiltersProps) {
  const { t } = useTranslation();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    bodyParts,
    muscles: targetMuscles,
    equipments: equipment,
    searchQuery: storeSearchQuery,
    selectedBodyPart,
    selectedEquipment,
    selectedTargetMuscle,
    showFavoritesOnly,
    setSearchQuery: setStoreSearchQuery,
    setSelectedBodyPart,
    setSelectedEquipment,
    setSelectedTargetMuscle,
    setShowFavoritesOnly,
    clearFilters,
  } = useExerciseFilterStore();

  // Initialize local search query from store
  useEffect(() => {
    setLocalSearchQuery(storeSearchQuery);
  }, [storeSearchQuery]);

  // Debounce search query
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setStoreSearchQuery(localSearchQuery);
    }, 200);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [localSearchQuery, setStoreSearchQuery]);

  // Notify parent when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        searchQuery: storeSearchQuery,
        bodyPart: selectedBodyPart,
        equipment: selectedEquipment,
        targetMuscle: selectedTargetMuscle,
        showFavoritesOnly,
      });
    }
  }, [
    storeSearchQuery,
    selectedBodyPart,
    selectedEquipment,
    selectedTargetMuscle,
    showFavoritesOnly,
    onFiltersChange,
  ]);

  const handleClearFilters = () => {
    setLocalSearchQuery('');
    clearFilters();
  };

  const getStringValue = (value: string | { name: string } | any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'name' in value)
      return value.name;
    return String(value || '');
  };

  return (
    <div className="space-y-4">
      {/* Search and Reset Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('workouts.exerciseLibrary.search')}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => setLocalSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showResetButton && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="shrink-0 h-11"
          >
            <X className="h-4 w-4 " />
            {t('workouts.exerciseLibrary.filters.resetFilters')}
          </Button>
        )}
      </div>

      {/* Favorites Filter */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-favorites-only"
          checked={showFavoritesOnly}
          onCheckedChange={(checked) => setShowFavoritesOnly(checked === true)}
        />
        <Label
          htmlFor="show-favorites-only"
          className="text-sm font-normal cursor-pointer flex items-center gap-2"
        >
          <Heart className="h-4 w-4" />
          {t('workouts.exerciseLibrary.filters.showFavoritesOnly')}
        </Label>
      </div>

      {/* Filter Dropdowns */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{t('workouts.exerciseLibrary.filters.bodyPart')}</Label>
          <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
            <SelectTrigger className="w-full">
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
                    {translateBodyPart(t, part)}
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
            <SelectTrigger className="w-full">
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
                    {translateEquipment(t, eq)}
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
            <SelectTrigger className="w-full">
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
                    {translateMuscle(t, muscle)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
