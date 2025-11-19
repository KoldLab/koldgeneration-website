import type { TFunction } from 'i18next';

/**
 * Helper function to safely extract string value from various formats
 */
const getStringValue = (value: string | { name: string } | any): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'name' in value) return value.name;
  return String(value || '');
};

/**
 * Helper function to ensure translation result is always a string
 */
const ensureString = (value: any, fallback: string): string => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return fallback;
};

/**
 * Translate a body part name
 */
export const translateBodyPart = (t: TFunction, value: string | { name: string } | any): string => {
  const key = getStringValue(value);
  const translationKey = `workouts.bodyParts.${key}`;
  try {
    const translated = t(translationKey);
    // Ensure we always return a string, never an object
    return ensureString(translated, key);
  } catch (error) {
    console.warn('Translation error for body part:', key, error);
    return key;
  }
};

/**
 * Translate an equipment name
 */
export const translateEquipment = (t: TFunction, value: string | { name: string } | any): string => {
  const key = getStringValue(value);
  const translationKey = `workouts.equipments.${key}`;
  try {
    const translated = t(translationKey);
    // Ensure we always return a string, never an object
    return ensureString(translated, key);
  } catch (error) {
    console.warn('Translation error for equipment:', key, error);
    return key;
  }
};

/**
 * Translate a muscle name
 */
export const translateMuscle = (t: TFunction, value: string | { name: string } | any): string => {
  const key = getStringValue(value);
  const translationKey = `workouts.muscles.${key}`;
  try {
    const translated = t(translationKey);
    // Ensure we always return a string, never an object
    return ensureString(translated, key);
  } catch (error) {
    console.warn('Translation error for muscle:', key, error);
    return key;
  }
};

