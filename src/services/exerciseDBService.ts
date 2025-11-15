import type { ExerciseDBExercise } from '@/types/workout';

// Use proxy in production to avoid CORS issues, direct URL in development or if explicitly set
const getAPIBaseURL = () => {
  // If explicitly set, use it
  if (import.meta.env.VITE_EXERCISEDB_API_URL) {
    return import.meta.env.VITE_EXERCISEDB_API_URL;
  }
  // In production, use proxy to avoid CORS
  if (import.meta.env.PROD) {
    return '/api/exercisedb'; // Use proxy path
  }
  // In development, use direct URL
  return 'https://kold-exercisedb-api.vercel.app';
};

const API_BASE_URL = getAPIBaseURL();
const API_VERSION = '/v1';

// API Response types
interface ExerciseDBResponse<T> {
  success: boolean;
  metadata?: {
    totalPages: number;
    totalExercises: number;
    currentPage: number;
    previousPage: string | null;
    nextPage: string | null;
  };
  data: T;
}

export interface ExerciseDBFilterParams {
  bodyParts?: string; // Comma-separated values (e.g., "upper arms,chest")
  equipment?: string; // Comma-separated values (e.g., "dumbbell,barbell")
  muscles?: string; // Comma-separated values (e.g., "chest,triceps") - target muscles
  search?: string; // Search query
  sortBy?: string; // Sort field (e.g., "name")
  sortOrder?: 'asc' | 'desc'; // Sort order
  limit?: number;
  offset?: number;
}

// Helper function to make API requests
async function fetchAPI<T>(endpoint: string): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Handle different response formats
    if (data.success === false) {
      throw new Error(data.message || 'API request failed');
    }

    // If response has a 'data' property, return that, otherwise return the whole response
    return (data.data || data) as T;
  } catch (error) {
    console.error('ExerciseDB API Error:', error);
    throw error;
  }
}

// Helper to fetch paginated response
async function fetchPaginatedAPI(
  endpoint: string
): Promise<ExerciseDBResponse<ExerciseDBExercise[]>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as ExerciseDBResponse<
      ExerciseDBExercise[]
    >;

    if (data.success === false) {
      throw new Error('API request failed');
    }

    return data;
  } catch (error) {
    console.error('ExerciseDB API Error:', error);
    throw error;
  }
}

/**
 * Get all exercises from ExerciseDB API with optional filtering
 * Uses the /filter endpoint which supports advanced filtering
 */
export async function getAllExercises(
  params?: ExerciseDBFilterParams
): Promise<{
  exercises: ExerciseDBExercise[];
  metadata?: ExerciseDBResponse<ExerciseDBExercise[]>['metadata'];
}> {
  try {
    const queryParams = new URLSearchParams();

    // Use the filter endpoint for all requests
    if (params?.bodyParts) queryParams.append('bodyParts', params.bodyParts);
    if (params?.equipment) queryParams.append('equipment', params.equipment);
    if (params?.muscles) queryParams.append('muscles', params.muscles);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append('offset', params.offset.toString());

    const endpoint = `${API_VERSION}/exercises/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    // Debug: log the request URL
    console.log('ExerciseDB API Request:', fullUrl);
    console.log('Filter params:', params);

    const response = await fetchPaginatedAPI(endpoint);

    return {
      exercises: response.data || [],
      metadata: response.metadata,
    };
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    throw error;
  }
}

/**
 * Get a specific exercise by ID
 */
export async function getExerciseById(
  exerciseId: string
): Promise<ExerciseDBExercise> {
  const endpoint = `${API_VERSION}/exercises/${exerciseId}`;
  return fetchAPI<ExerciseDBExercise>(endpoint);
}

/**
 * Get exercises with advanced filtering
 */
export async function getExercisesWithFilters(
  params: ExerciseDBFilterParams
): Promise<{
  exercises: ExerciseDBExercise[];
  metadata?: ExerciseDBResponse<ExerciseDBExercise[]>['metadata'];
}> {
  return getAllExercises(params);
}

/**
 * Get all body parts
 */
export async function getBodyParts(): Promise<string[]> {
  const endpoint = `${API_VERSION}/bodyparts`;
  return fetchAPI<string[]>(endpoint);
}

/**
 * Get all muscles
 */
export async function getMuscles(): Promise<string[]> {
  const endpoint = `${API_VERSION}/muscles`;
  return fetchAPI<string[]>(endpoint);
}

/**
 * Get all equipment
 */
export async function getEquipment(): Promise<string[]> {
  const endpoint = `${API_VERSION}/equipments`;
  return fetchAPI<string[]>(endpoint);
}

/**
 * Get all target muscles (alias for getMuscles for backward compatibility)
 */
export async function getTargetMuscles(): Promise<string[]> {
  return getMuscles();
}

// Legacy functions for backward compatibility (use new filtering instead)
/**
 * @deprecated Use getAllExercises({ bodyParts }) instead
 */
export async function getExercisesByBodyPart(
  bodyPart: string
): Promise<ExerciseDBExercise[]> {
  const result = await getAllExercises({ bodyParts: bodyPart });
  return result.exercises;
}

/**
 * @deprecated Use getAllExercises({ equipment }) instead
 */
export async function getExercisesByEquipment(
  equipment: string
): Promise<ExerciseDBExercise[]> {
  const result = await getAllExercises({ equipment });
  return result.exercises;
}

/**
 * @deprecated Use getAllExercises({ muscles }) instead
 */
export async function getExercisesByTargetMuscle(
  muscle: string
): Promise<ExerciseDBExercise[]> {
  const result = await getAllExercises({ muscles: muscle });
  return result.exercises;
}

/**
 * @deprecated Use getAllExercises with search query instead
 */
export async function searchExercises(
  query: string
): Promise<ExerciseDBExercise[]> {
  // Search is done client-side in the component
  const result = await getAllExercises();
  return result.exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(query.toLowerCase())
  );
}
