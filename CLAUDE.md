# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite production build (output: dist/)
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run preview      # Preview production build locally
```

**Always run `npm run build` after making changes** to catch TypeScript errors before marking a task complete. Fix all errors before finishing — no unused variables (`TS6133`), no type mismatches (`TS2322`).

There are no tests configured in this project.

## Architecture

**Stack:** React 19, Vite 7, TypeScript 5.9, TailwindCSS 4, Shadcn UI (new-york style), Supabase (Auth + Postgres + Realtime), Zustand, i18next, React Router 7, React Hook Form + Zod, Sonner toasts.

**Path alias:** `@/` → `src/`

### Routing

Routes are defined in `src/routes.tsx` (React Router 7 `<Routes>` tree) with metadata in `src/routesConfig.ts`. Protected routes use `<ProtectedRoute>` from `src/components/auth/`. New routes require entries in both files.

### State & Data

- **Zustand stores** (`src/stores/`) manage local/session state with localStorage persistence. Each store file exports a single `use*Store` hook.
- **React Contexts** (`src/contexts/`): `AuthContext` (Supabase user + Google OAuth sign-in, normalized to `{ uid, email, displayName, photoURL }`) and `ThemeContext` (light/dark). Access via `useAuth()` and `useTheme()`.
- **Supabase services** (`src/services/`) contain all database operations. Data is always scoped to `user_id` via Postgres RLS. Schema and policies live in `supabase/migrations/`.
- **ExerciseDB API** is called directly from the client and cached in `exerciseCacheStore`.

### Components

- Page-level components live in `src/components/pages/` grouped by feature.
- Shadcn UI primitives are in `src/components/ui/` — add new ones with `npx shadcn@latest add <component>`.
- `src/components/Layout.tsx` wraps all pages; `NavBar.tsx` and `ThemeToggle.tsx` are standalone.

## Key Conventions

### Internationalisation (i18n) — mandatory

Every user-facing string must use the `useTranslation` hook. Never hardcode display text.

```tsx
const { t } = useTranslation();
return <h1>{t('myFeature.title')}</h1>;
```

Translation files live in `src/i18n/locales/en/` and `src/i18n/locales/fr/`. **Both languages are required** for every new key. Follow dot-notation key structure: `feature.section.item` in camelCase (e.g. `workouts.logWorkout.addExercise`). Reuse `common.*` keys for shared labels (Save, Cancel, Delete, etc.). Use `{{variable}}` for interpolation.

### User Feedback

Use the `useToast` hook (`src/hooks/useToast.ts`) — not `sonner` directly — for consistent styling:

```tsx
const { success, error, successWithUndo, promise } = useToast();
success(t('workouts.saved'));
error(t('workouts.saveError'));
successWithUndo(t('workouts.deleted'), handleUndo, t('common.undo'));
promise(saveWorkout(), { loading: t('saving'), success: t('saved'), error: t('error') });
```

Use `AlertDialog` **only** for irreversible destructive actions (delete, clear all data). Use toasts for everything else including reversible deletes (with undo).

### Responsive Design

Mobile-first. All UI must work on mobile and desktop. Use Tailwind breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Minimum touch target: `h-11` (44px). Stack vertically on mobile, arrange horizontally on desktop.

### Typography

Use these exact Tailwind class combinations for consistency:

| Element | Classes |
|---------|---------|
| h1 | `scroll-m-20 text-4xl font-extrabold tracking-tight text-balance` |
| h2 | `scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0` |
| h3 | `scroll-m-20 text-2xl font-semibold tracking-tight` |
| h4 | `scroll-m-20 text-xl font-semibold tracking-tight` |
| paragraph | `leading-7 [&:not(:first-child)]:mt-6` |
| muted/helper | `text-muted-foreground text-sm` |
| lead | `text-muted-foreground text-xl` |

### Environment Variables

Supabase requires `VITE_` prefixed variables (see `src/lib/supabase.ts`):

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Vite exposes the current git commit hash at build time as `__GIT_COMMIT_HASH__` (injected in `vite.config.ts`).
