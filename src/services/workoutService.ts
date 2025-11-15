import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Exercise,
  WorkoutRoutine,
  WorkoutLog,
  ExerciseEntry,
  ExerciseSet,
} from '@/types/workout';

// Collection names
const EXERCISES_COLLECTION = 'exercises';
const ROUTINES_COLLECTION = 'routines';
const LOGS_COLLECTION = 'workoutLogs';

// Helper: Convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
}

// Helper: Convert Date to Firestore timestamp
function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

// ==================== EXERCISES ====================

/**
 * Create a new exercise
 */
export async function createExercise(
  userId: string,
  exerciseData: Omit<Exercise, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Exercise> {
  const now = new Date();
  const exerciseRef = await addDoc(collection(db, EXERCISES_COLLECTION), {
    ...exerciseData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const docSnap = await getDoc(exerciseRef);
  if (!docSnap.exists()) {
    throw new Error('Failed to create exercise');
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  } as Exercise;
}

/**
 * Get all exercises for a user
 */
export async function getExercisesByUserId(userId: string): Promise<Exercise[]> {
  const q = query(
    collection(db, EXERCISES_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as Exercise;
  });
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(exerciseId: string): Promise<Exercise | null> {
  const docRef = doc(db, EXERCISES_COLLECTION, exerciseId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  } as Exercise;
}

/**
 * Update an exercise
 */
export async function updateExercise(
  exerciseId: string,
  updates: Partial<Omit<Exercise, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const exerciseRef = doc(db, EXERCISES_COLLECTION, exerciseId);
  await updateDoc(exerciseRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete an exercise
 */
export async function deleteExercise(exerciseId: string): Promise<void> {
  const exerciseRef = doc(db, EXERCISES_COLLECTION, exerciseId);
  await deleteDoc(exerciseRef);
}

/**
 * Import exercise from ExerciseDB
 */
export async function importExerciseFromDB(
  userId: string,
  exerciseDBData: {
    exerciseDBId: string;
    name: string;
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
  }
): Promise<Exercise> {
  return createExercise(userId, {
    ...exerciseDBData,
    source: 'exercisedb',
    description: exerciseDBData.overview,
  });
}

// ==================== ROUTINES ====================

/**
 * Create a new workout routine
 */
export async function createRoutine(
  userId: string,
  routineData: Omit<WorkoutRoutine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<WorkoutRoutine> {
  const routineRef = await addDoc(collection(db, ROUTINES_COLLECTION), {
    ...routineData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const docSnap = await getDoc(routineRef);
  if (!docSnap.exists()) {
    throw new Error('Failed to create routine');
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    exercises: (data.exercises || []).map((ex: any) => ({
      ...ex,
      sets: ex.sets || [],
    })),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  } as WorkoutRoutine;
}

/**
 * Get all routines for a user
 */
export async function getRoutinesByUserId(userId: string): Promise<WorkoutRoutine[]> {
  const q = query(
    collection(db, ROUTINES_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      exercises: (data.exercises || []).map((ex: any) => ({
        ...ex,
        sets: ex.sets || [],
      })),
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as WorkoutRoutine;
  });
}

/**
 * Get routine by ID
 */
export async function getRoutineById(routineId: string): Promise<WorkoutRoutine | null> {
  const docRef = doc(db, ROUTINES_COLLECTION, routineId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    exercises: (data.exercises || []).map((ex: any) => ({
      ...ex,
      sets: ex.sets || [],
    })),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  } as WorkoutRoutine;
}

/**
 * Update a routine
 */
export async function updateRoutine(
  routineId: string,
  updates: Partial<Omit<WorkoutRoutine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
  await updateDoc(routineRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a routine
 */
export async function deleteRoutine(routineId: string): Promise<void> {
  const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
  await deleteDoc(routineRef);
}

// ==================== WORKOUT LOGS ====================

/**
 * Helper: Remove undefined values from an object
 */
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

/**
 * Create a new workout log
 */
export async function createWorkoutLog(
  userId: string,
  logData: Omit<WorkoutLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<WorkoutLog> {
  // Remove undefined values before saving
  const cleanedData = removeUndefined({
    ...logData,
    userId,
    date: dateToTimestamp(logData.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const logRef = await addDoc(collection(db, LOGS_COLLECTION), cleanedData);

  const docSnap = await getDoc(logRef);
  if (!docSnap.exists()) {
    throw new Error('Failed to create workout log');
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: timestampToDate(data.date),
    exercises: (data.exercises || []).map((ex: any) => ({
      ...ex,
      sets: (ex.sets || []).map((set: any) => ({
        ...set,
      })),
    })),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  } as WorkoutLog;
}

/**
 * Get all workout logs for a user
 */
export async function getWorkoutLogsByUserId(
  userId: string,
  options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<WorkoutLog[]> {
  let q = query(
    collection(db, LOGS_COLLECTION),
    where('userId', '==', userId)
  );

  // Add date range filters if provided
  if (options?.startDate) {
    q = query(q, where('date', '>=', dateToTimestamp(options.startDate)));
  }
  if (options?.endDate) {
    q = query(q, where('date', '<=', dateToTimestamp(options.endDate)));
  }

  // Order by date (most recent first)
  q = query(q, orderBy('date', 'desc'), orderBy('createdAt', 'desc'));

  // Add limit if provided
  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: timestampToDate(data.date),
      exercises: (data.exercises || []).map((ex: any) => ({
        ...ex,
        sets: (ex.sets || []).map((set: any) => ({
          ...set,
        })),
      })),
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as WorkoutLog;
  });
}

/**
 * Get workout log by ID
 */
export async function getWorkoutLogById(logId: string): Promise<WorkoutLog | null> {
  const docRef = doc(db, LOGS_COLLECTION, logId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: timestampToDate(data.date),
    exercises: (data.exercises || []).map((ex: any) => ({
      ...ex,
      sets: (ex.sets || []).map((set: any) => ({
        ...set,
      })),
    })),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  } as WorkoutLog;
}

/**
 * Update a workout log
 */
export async function updateWorkoutLog(
  logId: string,
  updates: Partial<Omit<WorkoutLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const logRef = doc(db, LOGS_COLLECTION, logId);
  const updateData: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  // Convert date to timestamp if provided
  if (updates.date) {
    updateData.date = dateToTimestamp(updates.date);
  }

  await updateDoc(logRef, updateData);
}

/**
 * Delete a workout log
 */
export async function deleteWorkoutLog(logId: string): Promise<void> {
  const logRef = doc(db, LOGS_COLLECTION, logId);
  await deleteDoc(logRef);
}

