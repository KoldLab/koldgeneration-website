# Koldgeneration — Design Brief

> Hand this document to a design tool (e.g. Claude Design, v0, Figma AI) along with screenshots of the current UI.

---

## 1. What the app is

**Koldgeneration** is a personal multi-tool hub. It is a single app that combines several unrelated utilities under one roof, all belonging to the same user.

It is not a SaaS product. Think of it as a personal dashboard — the kind of thing a developer builds for themselves and their friends.

**Feature areas:**

| Section | What it does | Auth required? |
|---|---|---|
| **Tools › Timer** | Stopwatch + countdown timer | No |
| **Tools › Maze Generator** | Generates printable perfect mazes | No |
| **Minecraft Tools › Chest Image Generator** | Creates images of Minecraft chest contents | No |
| **Minecraft Tools › Shulker Box Command Generator** | Generates `/give` commands from Litematica lists | No |
| **Workouts** | Workout logging, exercise library (ExerciseDB API) | Yes |
| **Movies & Marathons** | Track movies watched, create/run movie marathons | Yes |
| **Tournaments** | Create and manage bracket tournaments, join by code | Partial |
| **Notes** | Collaborative notes with share/invite links | Yes |

---

## 2. Current tech stack (for the implementer, not the designer)

- React 19 + Vite 7 + TypeScript 5.9
- TailwindCSS 4
- **Currently:** Shadcn UI + Radix UI primitives → **being replaced** with a custom design system
- Firebase Auth + Firestore
- React Router 7, React Hook Form + Zod, i18next (EN + FR)
- Zustand for state
- Lucide React for icons (keep these)

---

## 3. Layout structure

```
┌──────────────────────────────────────────┐
│  HEADER (80vw centred)                   │
│  [Logo]  [Nav menu]  [Lang] [Theme] [Auth]│
├──────────────────────────────────────────┤
│  MAIN (80vw centred, padded)             │
│  <page content>                          │
├──────────────────────────────────────────┤
│  FOOTER                                  │
└──────────────────────────────────────────┘
```

- Nav is a **horizontal dropdown menu** on desktop, a **slide-in sheet** (hamburger) on mobile.
- Auth state changes what nav items appear (some routes hidden when logged out).
- A **theme toggle** (light/dark) and **language switcher** (EN/FR) are always visible in the header.

---

## 4. Home page

Grid of feature cards (1 col mobile → 2 col tablet → 3 col desktop). Each card has:
- A coloured gradient banner (unique per card) with a centred icon
- A title + "Explore →" CTA below
- Description revealed on hover (overlay on the banner)
- Auth-required badge + disabled state for locked cards

Current gradients used (for reference / inspiration):
- Timer: `emerald → teal → sky`
- Maze: `violet → purple → fuchsia`
- Workouts: `red → rose → pink`
- Minecraft List: `orange → amber → rose`
- Create Tournament: `fuchsia → purple → indigo`
- My Tournaments: `blue → cyan → sky`
- Enter Tournament: `amber → orange → red`

---

## 5. Current design tokens

**Color space:** OKLCH throughout.

### Light mode
```
background:        oklch(1 0 0)          /* pure white */
foreground:        oklch(0.145 0 0)      /* near black */
card:              oklch(1 0 0)
primary:           oklch(0.205 0 0)      /* dark grey */
primary-fg:        oklch(0.985 0 0)
secondary:         oklch(0.97 0 0)       /* very light grey */
muted:             oklch(0.97 0 0)
muted-fg:          oklch(0.556 0 0)
accent:            oklch(0.97 0 0)
pop:               oklch(0.7 0.15 50)    /* warm orange accent */
destructive:       oklch(0.577 0.245 27.325)
border:            oklch(0.922 0 0)
```

### Dark mode
```
background:        oklch(0.145 0 0)      /* near black */
foreground:        oklch(0.985 0 0)      /* near white */
card:              oklch(0.205 0 0)
primary:           oklch(0.922 0 0)      /* light grey */
secondary:         oklch(0.269 0 0)
muted:             oklch(0.269 0 0)
pop:               oklch(0.75 0.18 50)   /* warm orange accent */
```

**Note:** The current palette is almost entirely achromatic (grey scale) with one warm orange accent (`pop`). The redesign can change this completely.

**Radius:** `0.5rem` base (`--radius`), with sm/md/lg/xl variants.

---

## 6. Typography scale (current, from Tailwind + Shadcn conventions)

| Role | Classes |
|---|---|
| h1 | `text-4xl font-extrabold tracking-tight` |
| h2 | `text-3xl font-semibold tracking-tight border-b pb-2` |
| h3 | `text-2xl font-semibold tracking-tight` |
| h4 | `text-xl font-semibold tracking-tight` |
| body | `leading-7` |
| muted/helper | `text-sm text-muted-foreground` |
| lead | `text-xl text-muted-foreground` |

Font: system default (no custom font loaded currently).

---

## 7. Component inventory (what needs custom replacements)

These Shadcn components are actively used and need custom equivalents:

**Forms & inputs**
- Button (variants: default, ghost, outline, destructive, secondary; sizes: default, sm, lg, icon)
- Input
- Textarea
- Select (+ SelectItem, SelectGroup)
- Checkbox
- Switch
- Dropdown Menu

**Display**
- Card (+ CardHeader, CardContent, CardTitle, CardFooter)
- Badge
- Alert Dialog (for destructive confirmations only)
- Dialog / Modal
- Collapsible

**Navigation**
- Navigation Menu (desktop, with dropdown panels)
- Sheet (mobile slide-in panel)
- Tabs

**Utility**
- Scroll Area
- Separator
- Skeleton (loading states)
- Sonner / Toast notification system

---

## 8. Constraints the design must respect

1. **Dark + light mode** — both must look polished
2. **Mobile-first** — every view must work at 320px wide; minimum touch target 44px (`h-11`)
3. **Bilingual** — EN + FR; no hardcoded text in components
4. **Accessibility** — keyboard navigation, focus rings, ARIA labels (Radix primitives handle most of this today — keep equivalent behaviour)
5. **Auth states** — design must account for logged-in vs logged-out (nav items, locked cards, etc.)

---

## 9. What we want from the redesign

- **Drop Shadcn** — build custom components, own the design fully
- Open to changing the colour palette entirely (the current achromatic + orange is a starting point, not a constraint)
- Open to a new font pairing
- The aesthetic direction is **up for grabs** — provide your own direction or inspiration references when prompting the design tool

---

## 10. Screenshots to attach

Take screenshots of:
1. Home page (logged out, light mode)
2. Home page (logged in, dark mode)
3. One tool page (e.g. Timer at `/tools/timer`)
4. One auth-required page (e.g. Workouts dashboard)
5. NavBar (desktop) + mobile hamburger open state
6. A page with a form (e.g. Create Tournament)
7. A page with a data table or list (e.g. Exercise Library or My Tournaments)

Run `npm run dev` and visit `http://localhost:5173` to capture these.
