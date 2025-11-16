import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import split translation files
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enHome from './locales/en/home.json';
import enError from './locales/en/error.json';
import enMinecraft from './locales/en/minecraft.json';
import enTimer from './locales/en/timer.json';
import enTournament from './locales/en/tournament.json';
import enWorkouts from './locales/en/workouts.json';
import enRoutes from './locales/en/routes.json';
import enDates from './locales/en/dates.json';

import frCommon from './locales/fr/common.json';
import frNav from './locales/fr/nav.json';
import frHome from './locales/fr/home.json';
import frError from './locales/fr/error.json';
import frMinecraft from './locales/fr/minecraft.json';
import frTimer from './locales/fr/timer.json';
import frTournament from './locales/fr/tournament.json';
import frWorkouts from './locales/fr/workouts.json';
import frRoutes from './locales/fr/routes.json';
import frDates from './locales/fr/dates.json';

// Merge all translations into a single namespace to maintain backward compatibility
const enTranslations = {
  common: enCommon,
  nav: enNav,
  home: enHome,
  error: enError,
  minecraft: enMinecraft,
  timer: enTimer,
  tournament: enTournament,
  workouts: enWorkouts,
  routes: enRoutes,
  dates: enDates,
};

const frTranslations = {
  common: frCommon,
  nav: frNav,
  home: frHome,
  error: frError,
  minecraft: frMinecraft,
  timer: frTimer,
  tournament: frTournament,
  workouts: frWorkouts,
  routes: frRoutes,
  dates: frDates,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      fr: {
        translation: frTranslations,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
