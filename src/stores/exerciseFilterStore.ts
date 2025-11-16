import { create } from 'zustand';
import {
  getBodyParts,
  getMuscles,
  getEquipment,
} from '@/services/exerciseDBService';

interface ExerciseFilterState {
  // Data
  bodyParts: string[];
  muscles: string[];
  equipments: string[];

  // Loading states
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Filter state (persisted across components)
  searchQuery: string;
  selectedBodyPart: string;
  selectedEquipment: string;
  selectedTargetMuscle: string;
  showFavoritesOnly: boolean;

  // Display options (persisted across components)
  columns: number;
  itemsPerPage: number;
  showGif: boolean;

  // Actions
  loadFilters: () => Promise<void>;
  reset: () => void;
  // Filter actions
  setSearchQuery: (query: string) => void;
  setSelectedBodyPart: (part: string) => void;
  setSelectedEquipment: (equipment: string) => void;
  setSelectedTargetMuscle: (muscle: string) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  clearFilters: () => void;
  // Display options actions
  setColumns: (columns: number) => void;
  setItemsPerPage: (items: number) => void;
  setShowGif: (show: boolean) => void;
  setDisplayOptions: (options: {
    columns: number;
    itemsPerPage: number;
    showGif: boolean;
  }) => void;
}

const initialState = {
  bodyParts: [],
  muscles: [],
  equipments: [],
  isLoading: false,
  isLoaded: false,
  error: null,
  // Filter state defaults
  searchQuery: '',
  selectedBodyPart: 'all',
  selectedEquipment: 'all',
  selectedTargetMuscle: 'all',
  showFavoritesOnly: false,
  // Display options defaults
  columns: 4,
  itemsPerPage: 20,
  showGif: true,
};

export const useExerciseFilterStore = create<ExerciseFilterState>(
  (set, get) => ({
    ...initialState,

    loadFilters: async () => {
      // Don't reload if already loaded
      if (get().isLoaded && !get().error) {
        return;
      }

      // Don't reload if already loading
      if (get().isLoading) {
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const [bodyParts, muscles, equipments] = await Promise.all([
          getBodyParts(),
          getMuscles(),
          getEquipment(),
        ]);

        set({
          bodyParts: bodyParts.sort(),
          muscles: muscles.sort(),
          equipments: equipments.sort(),
          isLoading: false,
          isLoaded: true,
          error: null,
        });
      } catch (error: any) {
        console.error('Failed to load exercise filters:', error);
        set({
          isLoading: false,
          error: error.message || 'Failed to load filter options',
        });
      }
    },

    reset: () => {
      set(initialState);
    },

    // Filter actions
    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },
    setSelectedBodyPart: (part: string) => {
      set({ selectedBodyPart: part });
    },
    setSelectedEquipment: (equipment: string) => {
      set({ selectedEquipment: equipment });
    },
    setSelectedTargetMuscle: (muscle: string) => {
      set({ selectedTargetMuscle: muscle });
    },
    setShowFavoritesOnly: (show: boolean) => {
      set({ showFavoritesOnly: show });
    },
    clearFilters: () => {
      set({
        searchQuery: '',
        selectedBodyPart: 'all',
        selectedEquipment: 'all',
        selectedTargetMuscle: 'all',
        showFavoritesOnly: false,
      });
    },

    // Display options actions
    setColumns: (columns: number) => {
      set({ columns });
    },
    setItemsPerPage: (items: number) => {
      set({ itemsPerPage: items });
    },
    setShowGif: (show: boolean) => {
      set({ showGif: show });
    },
    setDisplayOptions: (options: {
      columns: number;
      itemsPerPage: number;
      showGif: boolean;
    }) => {
      set({
        columns: options.columns,
        itemsPerPage: options.itemsPerPage,
        showGif: options.showGif,
      });
    },
  })
);
