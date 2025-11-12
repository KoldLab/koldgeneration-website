import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerMode = 'stopwatch' | 'countdown' | 'sports';
export type SportsPhase = 'idle' | 'work' | 'rest' | 'finished';

export interface SportsWorkoutConfig {
  totalSets: number;
  workMinutes: number;
  workSeconds: number;
  restMinutes: number;
  restSeconds: number;
}

const computeMilliseconds = (minutes: number, seconds: number) =>
  Math.max(0, (minutes * 60 + seconds) * 1000);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const DEFAULT_SPORTS_SETS = 3;
const DEFAULT_SPORTS_WORK_MINUTES = 1;
const DEFAULT_SPORTS_WORK_SECONDS = 0;
const DEFAULT_SPORTS_REST_MINUTES = 0;
const DEFAULT_SPORTS_REST_SECONDS = 30;

interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  countdownMinutes: number;
  countdownSeconds: number;
  startTimestamp: number | null;
  pausedTime: number;
  sportsTotalSets: number;
  sportsWorkMinutes: number;
  sportsWorkSeconds: number;
  sportsRestMinutes: number;
  sportsRestSeconds: number;
  sportsCurrentSet: number;
  sportsPhase: SportsPhase;
  setMode: (mode: TimerMode) => void;
  setCountdownMinutes: (value: number) => void;
  setCountdownSeconds: (value: number) => void;
  setSportsTotalSets: (value: number) => void;
  setSportsWorkMinutes: (value: number) => void;
  setSportsWorkSeconds: (value: number) => void;
  setSportsRestMinutes: (value: number) => void;
  setSportsRestSeconds: (value: number) => void;
  start: (now?: number) => void;
  pause: (now?: number) => void;
  reset: () => void;
  advanceSportsPhase: (now?: number) => void;
  resetSportsProgress: () => void;
  loadSportsWorkout: (config: SportsWorkoutConfig) => void;
  setStartTimestamp: (timestamp: number | null) => void;
  setIsRunning: (isRunning: boolean) => void;
  setPausedTime: (time: number) => void;
}

const getCountdownTarget = (minutes: number, seconds: number) =>
  computeMilliseconds(minutes, seconds);

const getWorkDuration = (
  state: Pick<TimerState, 'sportsWorkMinutes' | 'sportsWorkSeconds'>
) => computeMilliseconds(state.sportsWorkMinutes, state.sportsWorkSeconds);

const getRestDuration = (
  state: Pick<TimerState, 'sportsRestMinutes' | 'sportsRestSeconds'>
) => computeMilliseconds(state.sportsRestMinutes, state.sportsRestSeconds);

const buildSportsIdleState = (
  state: TimerState,
  overrides?: Partial<{ workMinutes: number; workSeconds: number }>
) => {
  const workMinutes = overrides?.workMinutes ?? state.sportsWorkMinutes;
  const workSeconds = overrides?.workSeconds ?? state.sportsWorkSeconds;
  const workDuration = computeMilliseconds(workMinutes, workSeconds);

  return {
    sportsPhase: 'idle' as SportsPhase,
    sportsCurrentSet: 1,
    startTimestamp: null,
    pausedTime: workDuration,
    isRunning: false,
  };
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      mode: 'stopwatch',
      isRunning: false,
      countdownMinutes: 5,
      countdownSeconds: 0,
      startTimestamp: null,
      pausedTime: 0,
      sportsTotalSets: DEFAULT_SPORTS_SETS,
      sportsWorkMinutes: DEFAULT_SPORTS_WORK_MINUTES,
      sportsWorkSeconds: DEFAULT_SPORTS_WORK_SECONDS,
      sportsRestMinutes: DEFAULT_SPORTS_REST_MINUTES,
      sportsRestSeconds: DEFAULT_SPORTS_REST_SECONDS,
      sportsCurrentSet: 1,
      sportsPhase: 'idle',
      setMode: (mode) =>
        set((state) => {
          if (state.mode === mode) {
            return {};
          }

          if (mode === 'stopwatch') {
            return {
              mode,
              isRunning: false,
              startTimestamp: null,
              pausedTime: 0,
            };
          }

          if (mode === 'countdown') {
            const target = getCountdownTarget(
              state.countdownMinutes,
              state.countdownSeconds
            );
            return {
              mode,
              isRunning: false,
              startTimestamp: null,
              pausedTime: target,
            };
          }

          const workDuration = getWorkDuration(state);
          return {
            mode,
            ...buildSportsIdleState(state),
            pausedTime: workDuration,
          };
        }),
      setCountdownMinutes: (value) =>
        set((state) => {
          const minutes = clamp(value, 0, 99);

          if (minutes === state.countdownMinutes) {
            return {};
          }

          const updates: Partial<TimerState> = {
            countdownMinutes: minutes,
          };

          if (state.mode === 'countdown' && !state.isRunning) {
            updates.pausedTime = getCountdownTarget(
              minutes,
              state.countdownSeconds
            );
            updates.startTimestamp = null;
          }

          return updates;
        }),
      setCountdownSeconds: (value) =>
        set((state) => {
          const seconds = clamp(value, 0, 59);

          if (seconds === state.countdownSeconds) {
            return {};
          }

          const updates: Partial<TimerState> = {
            countdownSeconds: seconds,
          };

          if (state.mode === 'countdown' && !state.isRunning) {
            updates.pausedTime = getCountdownTarget(
              state.countdownMinutes,
              seconds
            );
            updates.startTimestamp = null;
          }

          return updates;
        }),
      setSportsTotalSets: (value) =>
        set((state) => {
          const sets = Math.max(1, Math.floor(value) || 1);

          if (sets === state.sportsTotalSets) {
            return {};
          }

          const updates: Partial<TimerState> = {
            sportsTotalSets: sets,
          };

          if (state.mode === 'sports' && !state.isRunning) {
            Object.assign(updates, buildSportsIdleState(state));
          }

          return updates;
        }),
      setSportsWorkMinutes: (value) =>
        set((state) => {
          const minutes = clamp(value, 0, 99);

          if (minutes === state.sportsWorkMinutes) {
            return {};
          }

          const updates: Partial<TimerState> = {
            sportsWorkMinutes: minutes,
          };

          if (state.mode === 'sports' && !state.isRunning) {
            Object.assign(
              updates,
              buildSportsIdleState(state, { workMinutes: minutes })
            );
          }

          return updates;
        }),
      setSportsWorkSeconds: (value) =>
        set((state) => {
          const seconds = clamp(value, 0, 59);

          if (seconds === state.sportsWorkSeconds) {
            return {};
          }

          const updates: Partial<TimerState> = {
            sportsWorkSeconds: seconds,
          };

          if (state.mode === 'sports' && !state.isRunning) {
            Object.assign(
              updates,
              buildSportsIdleState(state, { workSeconds: seconds })
            );
          }

          return updates;
        }),
      setSportsRestMinutes: (value) =>
        set((state) => {
          const minutes = clamp(value, 0, 99);

          if (minutes === state.sportsRestMinutes) {
            return {};
          }

          const updates: Partial<TimerState> = {
            sportsRestMinutes: minutes,
          };

          if (state.mode === 'sports' && !state.isRunning) {
            Object.assign(updates, buildSportsIdleState(state));
          }

          return updates;
        }),
      setSportsRestSeconds: (value) =>
        set((state) => {
          const seconds = clamp(value, 0, 59);

          if (seconds === state.sportsRestSeconds) {
            return {};
          }

          const updates: Partial<TimerState> = {
            sportsRestSeconds: seconds,
          };

          if (state.mode === 'sports' && !state.isRunning) {
            Object.assign(updates, buildSportsIdleState(state));
          }

          return updates;
        }),
      start: (now = Date.now()) =>
        set((state) => {
          if (state.isRunning) {
            return {};
          }

          if (state.mode === 'stopwatch') {
            const startTimestamp = now - state.pausedTime;
            return {
              isRunning: true,
              startTimestamp,
            };
          }

          if (state.mode === 'countdown') {
            const base =
              state.pausedTime ||
              getCountdownTarget(
                state.countdownMinutes,
                state.countdownSeconds
              );
            const startTimestamp = now + base;

            return {
              isRunning: true,
              startTimestamp,
              pausedTime: base,
            };
          }

          const workDuration = getWorkDuration(state);
          const restDuration = getRestDuration(state);
          let nextPhase = state.sportsPhase;
          let nextSet = state.sportsCurrentSet;
          let duration = state.pausedTime;

          if (
            state.sportsPhase === 'idle' ||
            state.sportsPhase === 'finished'
          ) {
            nextSet = 1;
            nextPhase = workDuration > 0 ? 'work' : 'rest';
            duration =
              nextPhase === 'work'
                ? workDuration
                : restDuration > 0
                  ? restDuration
                  : workDuration;
          } else if (state.pausedTime <= 0) {
            duration =
              state.sportsPhase === 'work' ? workDuration : restDuration;
          }

          if (duration <= 0) {
            return {
              sportsPhase: 'finished',
              sportsCurrentSet: state.sportsTotalSets,
              isRunning: false,
              startTimestamp: null,
              pausedTime: 0,
            };
          }

          return {
            isRunning: true,
            startTimestamp: now + duration,
            pausedTime: duration,
            sportsPhase: nextPhase,
            sportsCurrentSet: nextSet,
          };
        }),
      pause: (now = Date.now()) =>
        set((state) => {
          if (!state.isRunning || state.startTimestamp === null) {
            return {};
          }

          if (state.mode === 'stopwatch') {
            const elapsed = now - state.startTimestamp;
            return {
              isRunning: false,
              startTimestamp: null,
              pausedTime: Math.max(0, elapsed),
            };
          }

          const remaining = Math.max(0, state.startTimestamp - now);
          return {
            isRunning: false,
            startTimestamp: null,
            pausedTime: remaining,
          };
        }),
      reset: () =>
        set((state) => {
          if (state.mode === 'stopwatch') {
            return {
              isRunning: false,
              startTimestamp: null,
              pausedTime: 0,
            };
          }

          if (state.mode === 'countdown') {
            const target = getCountdownTarget(
              state.countdownMinutes,
              state.countdownSeconds
            );

            return {
              isRunning: false,
              startTimestamp: null,
              pausedTime: target,
            };
          }

          return {
            ...buildSportsIdleState(state),
          };
        }),
      advanceSportsPhase: (now = Date.now()) =>
        set((state) => {
          if (state.mode !== 'sports') {
            return {};
          }

          const workDuration = getWorkDuration(state);
          const restDuration = getRestDuration(state);

          const finishWorkout = (): Partial<TimerState> => ({
            sportsPhase: 'finished',
            sportsCurrentSet: state.sportsTotalSets,
            startTimestamp: null,
            pausedTime: 0,
            isRunning: false,
          });

          const goToWork = (setNumber: number): Partial<TimerState> => {
            if (setNumber > state.sportsTotalSets) {
              return finishWorkout();
            }

            if (workDuration <= 0) {
              return goToRest(setNumber);
            }

            return {
              sportsPhase: 'work',
              sportsCurrentSet: setNumber,
              startTimestamp: now + workDuration,
              pausedTime: workDuration,
              isRunning: true,
            };
          };

          const goToRest = (setNumber: number): Partial<TimerState> => {
            if (restDuration <= 0) {
              return goToWork(setNumber + 1);
            }

            return {
              sportsPhase: 'rest',
              sportsCurrentSet: setNumber,
              startTimestamp: now + restDuration,
              pausedTime: restDuration,
              isRunning: true,
            };
          };

          if (state.sportsPhase === 'work') {
            return goToRest(state.sportsCurrentSet);
          }

          if (state.sportsPhase === 'rest') {
            return goToWork(state.sportsCurrentSet + 1);
          }

          if (state.sportsPhase === 'finished') {
            return finishWorkout();
          }

          return goToWork(1);
        }),
      resetSportsProgress: () =>
        set((state) => {
          if (state.mode !== 'sports') {
            return {};
          }

          return {
            ...buildSportsIdleState(state),
          };
        }),
      loadSportsWorkout: (config) =>
        set(() => {
          const totalSets = Math.max(1, Math.floor(config.totalSets) || 1);
          const workMinutes = clamp(config.workMinutes, 0, 99);
          const workSeconds = clamp(config.workSeconds, 0, 59);
          const restMinutes = clamp(config.restMinutes, 0, 99);
          const restSeconds = clamp(config.restSeconds, 0, 59);
          const workDuration = computeMilliseconds(workMinutes, workSeconds);
          const restDuration = computeMilliseconds(restMinutes, restSeconds);
          const initialPaused =
            workDuration > 0 ? workDuration : Math.max(restDuration, 0);

          return {
            mode: 'sports' as TimerMode,
            isRunning: false,
            startTimestamp: null,
            pausedTime: initialPaused,
            sportsTotalSets: totalSets,
            sportsWorkMinutes: workMinutes,
            sportsWorkSeconds: workSeconds,
            sportsRestMinutes: restMinutes,
            sportsRestSeconds: restSeconds,
            sportsCurrentSet: 1,
            sportsPhase: 'idle' as SportsPhase,
          };
        }),
      setStartTimestamp: (startTimestamp) => set({ startTimestamp }),
      setIsRunning: (isRunning) => set({ isRunning }),
      setPausedTime: (pausedTime) => set({ pausedTime }),
    }),
    {
      name: 'timer-state',
      version: 2,
      partialize: (state) => ({
        mode: state.mode,
        isRunning: state.isRunning,
        countdownMinutes: state.countdownMinutes,
        countdownSeconds: state.countdownSeconds,
        startTimestamp: state.startTimestamp,
        pausedTime: state.pausedTime,
        sportsTotalSets: state.sportsTotalSets,
        sportsWorkMinutes: state.sportsWorkMinutes,
        sportsWorkSeconds: state.sportsWorkSeconds,
        sportsRestMinutes: state.sportsRestMinutes,
        sportsRestSeconds: state.sportsRestSeconds,
        sportsCurrentSet: state.sportsCurrentSet,
        sportsPhase: state.sportsPhase,
      }),
    }
  )
);
