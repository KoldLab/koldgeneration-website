import { create } from 'zustand';
import {
  addFavoriteExerciseDB,
  removeFavoriteExerciseDB,
  addFavoriteCustomExercise,
  removeFavoriteCustomExercise,
  getFavoriteExercises,
  updateFavoriteExercises,
} from '@/services/workoutService';

interface ExerciseFavoritesState {
  // Favorite ExerciseDB exercise IDs
  favoriteExerciseDBIds: string[];
  // Favorite custom exercise IDs
  favoriteCustomExerciseIds: string[];
  
  // Loading state
  loading: boolean;
  initialized: boolean;
  
  // Actions
  initialize: (userId: string) => Promise<void>;
  addFavoriteExerciseDB: (userId: string, exerciseDBId: string) => Promise<void>;
  removeFavoriteExerciseDB: (userId: string, exerciseDBId: string) => Promise<void>;
  toggleFavoriteExerciseDB: (userId: string, exerciseDBId: string) => Promise<void>;
  isFavoriteExerciseDB: (exerciseDBId: string) => boolean;
  
  addFavoriteCustom: (userId: string, exerciseId: string) => Promise<void>;
  removeFavoriteCustom: (userId: string, exerciseId: string) => Promise<void>;
  toggleFavoriteCustom: (userId: string, exerciseId: string) => Promise<void>;
  isFavoriteCustom: (exerciseId: string) => boolean;
  
  clearAllFavorites: (userId: string) => Promise<void>;
}

export const useExerciseFavoritesStore = create<ExerciseFavoritesState>()(
  (set, get) => ({
    favoriteExerciseDBIds: [],
    favoriteCustomExerciseIds: [],
    loading: false,
    initialized: false,

    initialize: async (userId: string) => {
      if (get().initialized) return;
      
      set({ loading: true });
      try {
        const favorites = await getFavoriteExercises(userId);
        set({
          favoriteExerciseDBIds: favorites.exerciseDBIds,
          favoriteCustomExerciseIds: favorites.customExerciseIds,
          initialized: true,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to load favorites:', error);
        set({ loading: false });
      }
    },

    addFavoriteExerciseDB: async (userId: string, exerciseDBId: string) => {
      const state = get();
      if (state.favoriteExerciseDBIds.includes(exerciseDBId)) {
        return; // Already favorited
      }

      try {
        await addFavoriteExerciseDB(userId, exerciseDBId);
        set({
          favoriteExerciseDBIds: [...state.favoriteExerciseDBIds, exerciseDBId],
        });
      } catch (error) {
        console.error('Failed to add favorite:', error);
        throw error;
      }
    },

    removeFavoriteExerciseDB: async (userId: string, exerciseDBId: string) => {
      const state = get();
      try {
        await removeFavoriteExerciseDB(userId, exerciseDBId);
        set({
          favoriteExerciseDBIds: state.favoriteExerciseDBIds.filter(
            (id) => id !== exerciseDBId
          ),
        });
      } catch (error) {
        console.error('Failed to remove favorite:', error);
        throw error;
      }
    },

    toggleFavoriteExerciseDB: async (userId: string, exerciseDBId: string) => {
      const state = get();
      if (state.favoriteExerciseDBIds.includes(exerciseDBId)) {
        await state.removeFavoriteExerciseDB(userId, exerciseDBId);
      } else {
        await state.addFavoriteExerciseDB(userId, exerciseDBId);
      }
    },

    isFavoriteExerciseDB: (exerciseDBId: string) => {
      return get().favoriteExerciseDBIds.includes(exerciseDBId);
    },

    addFavoriteCustom: async (userId: string, exerciseId: string) => {
      const state = get();
      if (state.favoriteCustomExerciseIds.includes(exerciseId)) {
        return; // Already favorited
      }

      try {
        await addFavoriteCustomExercise(userId, exerciseId);
        set({
          favoriteCustomExerciseIds: [...state.favoriteCustomExerciseIds, exerciseId],
        });
      } catch (error) {
        console.error('Failed to add favorite:', error);
        throw error;
      }
    },

    removeFavoriteCustom: async (userId: string, exerciseId: string) => {
      const state = get();
      try {
        await removeFavoriteCustomExercise(userId, exerciseId);
        set({
          favoriteCustomExerciseIds: state.favoriteCustomExerciseIds.filter(
            (id) => id !== exerciseId
          ),
        });
      } catch (error) {
        console.error('Failed to remove favorite:', error);
        throw error;
      }
    },

    toggleFavoriteCustom: async (userId: string, exerciseId: string) => {
      const state = get();
      if (state.favoriteCustomExerciseIds.includes(exerciseId)) {
        await state.removeFavoriteCustom(userId, exerciseId);
      } else {
        await state.addFavoriteCustom(userId, exerciseId);
      }
    },

    isFavoriteCustom: (exerciseId: string) => {
      return get().favoriteCustomExerciseIds.includes(exerciseId);
    },

    clearAllFavorites: async (userId: string) => {
      try {
        await updateFavoriteExercises(userId, {
          exerciseDBIds: [],
          customExerciseIds: [],
        });
        set({
          favoriteExerciseDBIds: [],
          favoriteCustomExerciseIds: [],
        });
      } catch (error) {
        console.error('Failed to clear favorites:', error);
        throw error;
      }
    },
  })
);

