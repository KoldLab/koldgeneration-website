# Translation File Splitting Guide

## Current Structure

Currently, all translations are in single files:

- `src/i18n/locales/en.json` (~500 lines)
- `src/i18n/locales/fr.json` (~550 lines)

## Proposed Structure

Split translations by feature/page for better maintainability:

```
src/i18n/locales/
├── en/
│   ├── common.json          # Shared translations (buttons, labels, etc.)
│   ├── nav.json            # Navigation
│   ├── home.json           # Home page
│   ├── workouts.json       # Workouts feature
│   ├── tournaments.json    # Tournaments feature
│   ├── timer.json          # Timer tool
│   └── minecraft.json      # Minecraft tools
└── fr/
    ├── common.json
    ├── nav.json
    ├── home.json
    ├── workouts.json
    ├── tournaments.json
    ├── timer.json
    └── minecraft.json
```

## Benefits

1. **Better Organization**: Each feature has its own file
2. **Easier Maintenance**: Find translations faster
3. **Reduced Conflicts**: Multiple developers can work on different features
4. **Smaller Files**: Easier to navigate and edit
5. **Feature Isolation**: Changes to one feature don't affect others

## Migration Steps

### Step 1: Update i18n Config

Modify `src/i18n/config.ts` to load multiple namespaces:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import split translation files
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enHome from './locales/en/home.json';
import enWorkouts from './locales/en/workouts.json';
import enTournaments from './locales/en/tournaments.json';
import enTimer from './locales/en/timer.json';
import enMinecraft from './locales/en/minecraft.json';

import frCommon from './locales/fr/common.json';
import frNav from './locales/fr/nav.json';
import frHome from './locales/fr/home.json';
import frWorkouts from './locales/fr/workouts.json';
import frTournaments from './locales/fr/tournaments.json';
import frTimer from './locales/fr/timer.json';
import frMinecraft from './locales/fr/minecraft.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        nav: enNav,
        home: enHome,
        workouts: enWorkouts,
        tournaments: enTournaments,
        timer: enTimer,
        minecraft: enMinecraft,
      },
      fr: {
        common: frCommon,
        nav: frNav,
        home: frHome,
        workouts: frWorkouts,
        tournaments: frTournaments,
        timer: frTimer,
        minecraft: frMinecraft,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common', // Set default namespace
    ns: [
      'common',
      'nav',
      'home',
      'workouts',
      'tournaments',
      'timer',
      'minecraft',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

### Step 2: Update Component Usage

When using translations, specify the namespace:

```tsx
// Before (single namespace)
const { t } = useTranslation();
<h1>{t('workouts.title')}</h1>

// After (multiple namespaces)
const { t } = useTranslation('workouts');
<h1>{t('title')}</h1>

// Or use multiple namespaces
const { t: tCommon } = useTranslation('common');
const { t: tWorkouts } = useTranslation('workouts');
<button>{tCommon('save')}</button>
<h1>{tWorkouts('title')}</h1>
```

### Step 3: Split Existing Files

1. Create the new directory structure
2. Split `en.json` into feature files
3. Split `fr.json` into feature files
4. Update all components to use the new namespaces
5. Test thoroughly

## Example File Structure

### `locales/en/common.json`

```json
{
  "loading": "Loading...",
  "error": "Error",
  "signIn": "Sign in",
  "cancel": "Cancel",
  "save": "Save",
  "close": "Close"
}
```

### `locales/en/workouts.json`

```json
{
  "title": "Workouts",
  "description": "Track your fitness journey",
  "tabs": {
    "log": "Log Workout",
    "history": "History"
  },
  "logWorkout": {
    "title": "Log Workout",
    "addExercise": "Add Exercise"
  }
}
```

## Migration Strategy

1. **Gradual Migration**: Migrate one feature at a time
2. **Keep Old Files**: Keep `en.json` and `fr.json` during migration for fallback
3. **Update Components**: Update components as you migrate each feature
4. **Test Each Feature**: Test thoroughly after each migration
5. **Remove Old Files**: Once all features are migrated, remove the old files

## Alternative: Keep Single Namespace

If you prefer to keep a single namespace but split files, you can merge them:

```typescript
import enCommon from './locales/en/common.json';
import enWorkouts from './locales/en/workouts.json';
// ... other imports

const enTranslations = {
  ...enCommon,
  ...enWorkouts,
  // ... merge all
};

i18n.init({
  resources: {
    en: {
      translation: enTranslations,
    },
    // ...
  },
});
```

This keeps the same component code but splits the source files.
