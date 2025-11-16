import { useTranslation } from 'react-i18next';

/**
 * Helper function to get month name from translation
 * @param monthIndex 0-11 (0 = January, 11 = December)
 * @returns Translated month name
 */
export function useMonthName(monthIndex: number): string {
  const { t } = useTranslation();
  const months = [
    'dates.months.january',
    'dates.months.february',
    'dates.months.march',
    'dates.months.april',
    'dates.months.may',
    'dates.months.june',
    'dates.months.july',
    'dates.months.august',
    'dates.months.september',
    'dates.months.october',
    'dates.months.november',
    'dates.months.december',
  ];
  return t(months[monthIndex] || months[0]);
}

/**
 * Helper function to get short month name from translation
 * @param monthIndex 0-11 (0 = January, 11 = December)
 * @returns Translated short month name
 */
export function useMonthNameShort(monthIndex: number): string {
  const { t } = useTranslation();
  const monthsShort = [
    'dates.monthsShort.january',
    'dates.monthsShort.february',
    'dates.monthsShort.march',
    'dates.monthsShort.april',
    'dates.monthsShort.may',
    'dates.monthsShort.june',
    'dates.monthsShort.july',
    'dates.monthsShort.august',
    'dates.monthsShort.september',
    'dates.monthsShort.october',
    'dates.monthsShort.november',
    'dates.monthsShort.december',
  ];
  return t(monthsShort[monthIndex] || monthsShort[0]);
}

/**
 * Helper function to get day name from translation
 * @param dayIndex 0-6 (0 = Sunday, 6 = Saturday)
 * @returns Translated day name
 */
export function useDayName(dayIndex: number): string {
  const { t } = useTranslation();
  const days = [
    'dates.days.sunday',
    'dates.days.monday',
    'dates.days.tuesday',
    'dates.days.wednesday',
    'dates.days.thursday',
    'dates.days.friday',
    'dates.days.saturday',
  ];
  return t(days[dayIndex] || days[0]);
}

/**
 * Helper function to get short day name from translation
 * @param dayIndex 0-6 (0 = Sunday, 6 = Saturday)
 * @returns Translated short day name
 */
export function useDayNameShort(dayIndex: number): string {
  const { t } = useTranslation();
  const daysShort = [
    'dates.daysShort.sunday',
    'dates.daysShort.monday',
    'dates.daysShort.tuesday',
    'dates.daysShort.wednesday',
    'dates.daysShort.thursday',
    'dates.daysShort.friday',
    'dates.daysShort.saturday',
  ];
  return t(daysShort[dayIndex] || daysShort[0]);
}

/**
 * Non-hook version for use outside React components
 * Note: This requires i18n instance to be initialized
 */
export function getMonthName(monthIndex: number, i18n: any): string {
  const months = [
    'dates.months.january',
    'dates.months.february',
    'dates.months.march',
    'dates.months.april',
    'dates.months.may',
    'dates.months.june',
    'dates.months.july',
    'dates.months.august',
    'dates.months.september',
    'dates.months.october',
    'dates.months.november',
    'dates.months.december',
  ];
  return i18n.t(months[monthIndex] || months[0]);
}

export function getMonthNameShort(monthIndex: number, i18n: any): string {
  const monthsShort = [
    'dates.monthsShort.january',
    'dates.monthsShort.february',
    'dates.monthsShort.march',
    'dates.monthsShort.april',
    'dates.monthsShort.may',
    'dates.monthsShort.june',
    'dates.monthsShort.july',
    'dates.monthsShort.august',
    'dates.monthsShort.september',
    'dates.monthsShort.october',
    'dates.monthsShort.november',
    'dates.monthsShort.december',
  ];
  return i18n.t(monthsShort[monthIndex] || monthsShort[0]);
}

export function getDayName(dayIndex: number, i18n: any): string {
  const days = [
    'dates.days.sunday',
    'dates.days.monday',
    'dates.days.tuesday',
    'dates.days.wednesday',
    'dates.days.thursday',
    'dates.days.friday',
    'dates.days.saturday',
  ];
  return i18n.t(days[dayIndex] || days[0]);
}

export function getDayNameShort(dayIndex: number, i18n: any): string {
  const daysShort = [
    'dates.daysShort.sunday',
    'dates.daysShort.monday',
    'dates.daysShort.tuesday',
    'dates.daysShort.wednesday',
    'dates.daysShort.thursday',
    'dates.daysShort.friday',
    'dates.daysShort.saturday',
  ];
  return i18n.t(daysShort[dayIndex] || daysShort[0]);
}

