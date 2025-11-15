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

  // Actions
  loadFilters: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  bodyParts: [],
  muscles: [],
  equipments: [],
  isLoading: false,
  isLoaded: false,
  error: null,
};

export const useExerciseFilterStore = create<ExerciseFilterState>((set, get) => ({
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
}));

