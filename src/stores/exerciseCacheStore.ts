import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ExerciseDBExercise } from '@/types/workout';

interface ExerciseCacheState {
  // Cache of ExerciseDB exercises by their ID
  exercises: Record<string, ExerciseDBExercise>;
  
  // Actions
  getExercise: (exerciseDBId: string) => ExerciseDBExercise | undefined;
  setExercise: (exercise: ExerciseDBExercise) => void;
  setExercises: (exercises: ExerciseDBExercise[]) => void;
  clearCache: () => void;
}

const MAX_CACHE_SIZE = 500; // Limit cache to 500 exercises to prevent memory issues

export const useExerciseCacheStore = create<ExerciseCacheState>()(
  persist(
    (set, get) => ({
      exercises: {},

      getExercise: (exerciseDBId: string) => {
        return get().exercises[exerciseDBId];
      },

      setExercise: (exercise: ExerciseDBExercise) => {
        const state = get();
        const exercises = { ...state.exercises };
        
        // If cache is getting too large, remove oldest entries (simple FIFO)
        const exerciseIds = Object.keys(exercises);
        if (exerciseIds.length >= MAX_CACHE_SIZE) {
          // Remove first 100 entries (20% of cache)
          const toRemove = exerciseIds.slice(0, 100);
          toRemove.forEach((id) => delete exercises[id]);
        }
        
        exercises[exercise.exerciseId] = exercise;
        set({ exercises });
      },

      setExercises: (newExercises: ExerciseDBExercise[]) => {
        const state = get();
        const exercises = { ...state.exercises };
        
        newExercises.forEach((exercise) => {
          exercises[exercise.exerciseId] = exercise;
        });
        
        // If cache is too large, trim it
        const exerciseIds = Object.keys(exercises);
        if (exerciseIds.length >= MAX_CACHE_SIZE) {
          const toRemove = exerciseIds.slice(0, exerciseIds.length - MAX_CACHE_SIZE + newExercises.length);
          toRemove.forEach((id) => delete exercises[id]);
        }
        
        set({ exercises });
      },

      clearCache: () => {
        set({ exercises: {} });
      },
    }),
    {
      name: 'exercise-cache-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

