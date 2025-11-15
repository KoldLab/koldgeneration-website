// ExerciseDB API Types (from external API)
export interface ExerciseDBExercise {
  exerciseId: string;
  name: string;
  equipments: string[];
  bodyParts: string[];
  exerciseTypes: string[];
  difficulty: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  imageUrl?: string;
  gifUrl?: string;
  // Additional fields available when fetching exercise details
  videoUrl?: string;
  keywords?: string[];
  overview?: string;
  instructions?: string[];
  exerciseTips?: string[];
  variations?: string[];
  relatedExerciseIds?: string[];
}

// Local Exercise (stored in Firestore)
export interface Exercise {
  id: string;
  userId: string; // Owner of the exercise (user-specific library)
  name: string;
  description?: string;
  // ExerciseDB integration fields (optional)
  exerciseDBId?: string; // Reference to ExerciseDB exercise ID
  source: 'custom' | 'exercisedb'; // Source of the exercise
  // ExerciseDB metadata (optional, stored when imported)
  imageUrl?: string;
  videoUrl?: string;
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string[];
  bodyParts?: string[];
  instructions?: string[];
  exerciseTips?: string[];
  variations?: string[];
  relatedExerciseIds?: string[];
  keywords?: string[];
  overview?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Exercise Entry (Exercise within a Workout)
export interface ExerciseEntry {
  exerciseId: string; // Reference to Exercise
  exerciseName: string; // Snapshot of name at time of logging
  sets: ExerciseSet[];
  notes?: string; // Comments for this exercise in this workout
}

export interface ExerciseSet {
  setNumber: number;
  reps?: number;
  weight?: number; // "charge" in user's terms
  completed: boolean;
  notes?: string; // Optional per-set comments
}

// Workout Routine (Template)
export interface WorkoutRoutine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  exercises: ExerciseEntry[]; // Without set data (template)
  createdAt: Date;
  updatedAt: Date;
}

// Workout Log (Completed Workout)
export interface WorkoutLog {
  id: string;
  userId: string;
  routineId?: string; // Optional: if started from a routine
  routineName?: string; // Snapshot of routine name
  date: Date;
  exercises: ExerciseEntry[]; // With complete set data
  notes?: string; // Overall workout notes
  duration?: number; // Duration in minutes (optional)
  createdAt: Date;
  updatedAt: Date;
}
