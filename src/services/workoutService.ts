import { supabase } from '@/lib/supabase';
import type { Exercise, WorkoutRoutine, WorkoutLog } from '@/types/workout';

// ============================================================================
// Row <-> Domain mapping helpers
// ============================================================================

function rowToExercise(row: any): Exercise {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    exerciseDBId: row.exercise_db_id ?? undefined,
    source: row.source,
    imageUrl: row.image_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    targetMuscles: row.target_muscles ?? undefined,
    secondaryMuscles: row.secondary_muscles ?? undefined,
    equipment: row.equipment ?? undefined,
    bodyParts: row.body_parts ?? undefined,
    instructions: row.instructions ?? undefined,
    exerciseTips: row.exercise_tips ?? undefined,
    variations: row.variations ?? undefined,
    relatedExerciseIds: row.related_exercise_ids ?? undefined,
    keywords: row.keywords ?? undefined,
    overview: row.overview ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function exerciseToRow(
  userId: string,
  data: Partial<Omit<Exercise, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
) {
  const row: Record<string, unknown> = {};
  if (userId) row.user_id = userId;
  if (data.name !== undefined) row.name = data.name;
  if (data.description !== undefined) row.description = data.description;
  if (data.exerciseDBId !== undefined) row.exercise_db_id = data.exerciseDBId;
  if (data.source !== undefined) row.source = data.source;
  if (data.imageUrl !== undefined) row.image_url = data.imageUrl;
  if (data.videoUrl !== undefined) row.video_url = data.videoUrl;
  if (data.targetMuscles !== undefined) row.target_muscles = data.targetMuscles;
  if (data.secondaryMuscles !== undefined)
    row.secondary_muscles = data.secondaryMuscles;
  if (data.equipment !== undefined) row.equipment = data.equipment;
  if (data.bodyParts !== undefined) row.body_parts = data.bodyParts;
  if (data.instructions !== undefined) row.instructions = data.instructions;
  if (data.exerciseTips !== undefined) row.exercise_tips = data.exerciseTips;
  if (data.variations !== undefined) row.variations = data.variations;
  if (data.relatedExerciseIds !== undefined)
    row.related_exercise_ids = data.relatedExerciseIds;
  if (data.keywords !== undefined) row.keywords = data.keywords;
  if (data.overview !== undefined) row.overview = data.overview;
  return row;
}

function rowToRoutine(row: any): WorkoutRoutine {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    exercises: (row.exercises ?? []).map((ex: any) => ({
      ...ex,
      sets: ex.sets ?? [],
    })),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToWorkoutLog(row: any): WorkoutLog {
  return {
    id: row.id,
    userId: row.user_id,
    routineId: row.routine_id ?? undefined,
    routineName: row.routine_name ?? undefined,
    date: new Date(row.date),
    exercises: (row.exercises ?? []).map((ex: any) => ({
      ...ex,
      sets: (ex.sets ?? []).map((set: any) => ({ ...set })),
    })),
    notes: row.notes ?? undefined,
    duration: row.duration ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ==================== EXERCISES ====================

export async function createExercise(
  userId: string,
  exerciseData: Omit<Exercise, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exerciseToRow(userId, exerciseData))
    .select()
    .single();
  if (error) throw error;
  return rowToExercise(data);
}

export async function getExercisesByUserId(
  userId: string
): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToExercise);
}

export async function getExerciseById(
  exerciseId: string
): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToExercise(data) : null;
}

export async function updateExercise(
  exerciseId: string,
  updates: Partial<Omit<Exercise, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const row = exerciseToRow('', updates);
  row.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from('exercises')
    .update(row)
    .eq('id', exerciseId);
  if (error) throw error;
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId);
  if (error) throw error;
}

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

export async function createRoutine(
  userId: string,
  routineData: Omit<WorkoutRoutine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<WorkoutRoutine> {
  const { data, error } = await supabase
    .from('workout_routines')
    .insert({
      user_id: userId,
      name: routineData.name,
      description: routineData.description,
      exercises: routineData.exercises ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return rowToRoutine(data);
}

export async function getRoutinesByUserId(
  userId: string
): Promise<WorkoutRoutine[]> {
  const { data, error } = await supabase
    .from('workout_routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToRoutine);
}

export async function getRoutineById(
  routineId: string
): Promise<WorkoutRoutine | null> {
  const { data, error } = await supabase
    .from('workout_routines')
    .select('*')
    .eq('id', routineId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToRoutine(data) : null;
}

export async function updateRoutine(
  routineId: string,
  updates: Partial<
    Omit<WorkoutRoutine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.exercises !== undefined) row.exercises = updates.exercises;
  const { error } = await supabase
    .from('workout_routines')
    .update(row)
    .eq('id', routineId);
  if (error) throw error;
}

export async function deleteRoutine(routineId: string): Promise<void> {
  const { error } = await supabase
    .from('workout_routines')
    .delete()
    .eq('id', routineId);
  if (error) throw error;
}

// ==================== WORKOUT LOGS ====================

export async function createWorkoutLog(
  userId: string,
  logData: Omit<WorkoutLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<WorkoutLog> {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: userId,
      routine_id: logData.routineId ?? null,
      routine_name: logData.routineName ?? null,
      date: logData.date.toISOString(),
      exercises: logData.exercises ?? [],
      notes: logData.notes ?? null,
      duration: logData.duration ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToWorkoutLog(data);
}

export async function getWorkoutLogsByUserId(
  userId: string,
  options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<WorkoutLog[]> {
  let query = supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (options?.startDate) {
    query = query.gte('date', options.startDate.toISOString());
  }
  if (options?.endDate) {
    query = query.lte('date', options.endDate.toISOString());
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToWorkoutLog);
}

export async function getWorkoutLogById(
  logId: string
): Promise<WorkoutLog | null> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('id', logId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToWorkoutLog(data) : null;
}

export async function updateWorkoutLog(
  logId: string,
  updates: Partial<Omit<WorkoutLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.routineId !== undefined) row.routine_id = updates.routineId;
  if (updates.routineName !== undefined) row.routine_name = updates.routineName;
  if (updates.date !== undefined) row.date = updates.date.toISOString();
  if (updates.exercises !== undefined) row.exercises = updates.exercises;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.duration !== undefined) row.duration = updates.duration;
  const { error } = await supabase
    .from('workout_logs')
    .update(row)
    .eq('id', logId);
  if (error) throw error;
}

export async function deleteWorkoutLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', logId);
  if (error) throw error;
}

// ==================== EXERCISE FAVORITES ====================

export async function getFavoriteExercises(userId: string): Promise<{
  exerciseDBIds: string[];
  customExerciseIds: string[];
  exists: boolean;
}> {
  const { data, error } = await supabase
    .from('exercise_favorites')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return { exerciseDBIds: [], customExerciseIds: [], exists: false };
  }
  return {
    exerciseDBIds: data.exercise_db_ids ?? [],
    customExerciseIds: data.custom_exercise_ids ?? [],
    exists: true,
  };
}

export async function updateFavoriteExercises(
  userId: string,
  favorites: { exerciseDBIds: string[]; customExerciseIds: string[] },
  _documentExists?: boolean
): Promise<void> {
  const { error } = await supabase.from('exercise_favorites').upsert(
    {
      user_id: userId,
      exercise_db_ids: favorites.exerciseDBIds,
      custom_exercise_ids: favorites.customExerciseIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

export async function addFavoriteExerciseDB(
  userId: string,
  exerciseDBId: string
): Promise<void> {
  const current = await getFavoriteExercises(userId);
  if (!current.exerciseDBIds.includes(exerciseDBId)) {
    await updateFavoriteExercises(userId, {
      exerciseDBIds: [...current.exerciseDBIds, exerciseDBId],
      customExerciseIds: current.customExerciseIds,
    });
  }
}

export async function removeFavoriteExerciseDB(
  userId: string,
  exerciseDBId: string
): Promise<void> {
  const current = await getFavoriteExercises(userId);
  await updateFavoriteExercises(userId, {
    exerciseDBIds: current.exerciseDBIds.filter((id) => id !== exerciseDBId),
    customExerciseIds: current.customExerciseIds,
  });
}

export async function addFavoriteCustomExercise(
  userId: string,
  exerciseId: string
): Promise<void> {
  const current = await getFavoriteExercises(userId);
  if (!current.customExerciseIds.includes(exerciseId)) {
    await updateFavoriteExercises(userId, {
      exerciseDBIds: current.exerciseDBIds,
      customExerciseIds: [...current.customExerciseIds, exerciseId],
    });
  }
}

export async function removeFavoriteCustomExercise(
  userId: string,
  exerciseId: string
): Promise<void> {
  const current = await getFavoriteExercises(userId);
  await updateFavoriteExercises(userId, {
    exerciseDBIds: current.exerciseDBIds,
    customExerciseIds: current.customExerciseIds.filter(
      (id) => id !== exerciseId
    ),
  });
}
