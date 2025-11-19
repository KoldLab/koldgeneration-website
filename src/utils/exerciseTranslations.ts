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
 * Translate a body part name
 */
export const translateBodyPart = (t: TFunction, value: string | { name: string } | any): string => {
  const key = getStringValue(value);
  const translationKey = `workouts.bodyParts.${key}`;
  const translated = t(translationKey);
  // If translation returns an object or the key itself, return original key
  if (typeof translated !== 'string' || translated === translationKey) {
    return key;
  }
  return translated;
};

/**
 * Translate an equipment name
 */
export const translateEquipment = (t: TFunction, value: string | { name: string } | any): string => {
  const key = getStringValue(value);
  const translationKey = `workouts.equipments.${key}`;
  const translated = t(translationKey);
  // If translation returns an object or the key itself, return original key
  if (typeof translated !== 'string' || translated === translationKey) {
    return key;
  }
  return translated;
};

/**
 * Translate a muscle name
 */
export const translateMuscle = (t: TFunction, value: string | { name: string } | any): string => {
  const key = getStringValue(value);
  const translationKey = `workouts.muscles.${key}`;
  const translated = t(translationKey);
  // If translation returns an object or the key itself, return original key
  if (typeof translated !== 'string' || translated === translationKey) {
    return key;
  }
  return translated;
};

