import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ExerciseEntry } from '@/types/workout';

interface WorkoutState {
  // Current workout state
  workoutEntries: ExerciseEntry[];
  workoutDate: string | null; // Store as ISO string for serialization
  workoutDuration: string;
  workoutNotes: string;
  selectedRoutineId: string;
  collapsedExercises: Record<string, boolean>; // Map of exerciseId -> collapsed state

  // Actions
  setWorkoutEntries: (entries: ExerciseEntry[]) => void;
  setWorkoutDate: (date: Date | null) => void;
  setWorkoutDuration: (duration: string) => void;
  setWorkoutNotes: (notes: string) => void;
  setSelectedRoutineId: (routineId: string) => void;
  clearWorkout: () => void;
  updateWorkoutEntry: (index: number, entry: ExerciseEntry) => void;
  removeWorkoutEntry: (index: number) => void;
  addWorkoutEntry: (entry: ExerciseEntry) => void;
  setExerciseCollapsed: (exerciseId: string, collapsed: boolean) => void;
}

const initialState = {
  workoutEntries: [],
  workoutDate: null,
  workoutDuration: '',
  workoutNotes: '',
  selectedRoutineId: 'none',
  collapsedExercises: {},
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      ...initialState,

      setWorkoutEntries: (entries: ExerciseEntry[]) => {
        set({ workoutEntries: entries });
      },

      setWorkoutDate: (date: Date | null) => {
        set({ workoutDate: date ? date.toISOString() : null });
      },

      setWorkoutDuration: (duration: string) => {
        set({ workoutDuration: duration });
      },

      setWorkoutNotes: (notes: string) => {
        set({ workoutNotes: notes });
      },

      setSelectedRoutineId: (routineId: string) => {
        set({ selectedRoutineId: routineId });
      },

      clearWorkout: () => {
        set(initialState);
      },

      updateWorkoutEntry: (index: number, entry: ExerciseEntry) => {
        set((state) => {
          const updated = [...state.workoutEntries];
          updated[index] = entry;
          return { workoutEntries: updated };
        });
      },

      removeWorkoutEntry: (index: number) => {
        set((state) => {
          const updated = state.workoutEntries.filter((_, i) => i !== index);
          return { workoutEntries: updated };
        });
      },

      addWorkoutEntry: (entry: ExerciseEntry) => {
        set((state) => ({
          workoutEntries: [...state.workoutEntries, entry],
        }));
      },

      setExerciseCollapsed: (exerciseId: string, collapsed: boolean) => {
        set((state) => ({
          collapsedExercises: {
            ...state.collapsedExercises,
            [exerciseId]: collapsed,
          },
        }));
      },
    }),
    {
      name: 'workout-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
