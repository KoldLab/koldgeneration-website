import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerMode = 'stopwatch' | 'countdown';

const computeCountdownTarget = (minutes: number, seconds: number) =>
  (minutes * 60 + seconds) * 1000;

interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  countdownMinutes: number;
  countdownSeconds: number;
  startTimestamp: number | null;
  pausedTime: number;
  setMode: (mode: TimerMode) => void;
  setCountdownMinutes: (value: number) => void;
  setCountdownSeconds: (value: number) => void;
  start: (now?: number) => void;
  pause: (now?: number) => void;
  reset: () => void;
  setStartTimestamp: (timestamp: number | null) => void;
  setIsRunning: (isRunning: boolean) => void;
  setPausedTime: (time: number) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      mode: 'stopwatch',
      isRunning: false,
      countdownMinutes: 5,
      countdownSeconds: 0,
      startTimestamp: null,
      pausedTime: 0,
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

          const target = computeCountdownTarget(
            state.countdownMinutes,
            state.countdownSeconds
          );

          return {
            mode,
            isRunning: false,
            startTimestamp: null,
            pausedTime: target,
          };
        }),
      setCountdownMinutes: (value) =>
        set((state) => {
          const minutes = Math.max(0, Math.min(99, value));

          if (minutes === state.countdownMinutes) {
            return {};
          }

          const updates: Partial<TimerState> = {
            countdownMinutes: minutes,
          };

          if (state.mode === 'countdown' && !state.isRunning) {
            updates.pausedTime = computeCountdownTarget(
              minutes,
              state.countdownSeconds
            );
            updates.startTimestamp = null;
          }

          return updates;
        }),
      setCountdownSeconds: (value) =>
        set((state) => {
          const seconds = Math.max(0, Math.min(59, value));

          if (seconds === state.countdownSeconds) {
            return {};
          }

          const updates: Partial<TimerState> = {
            countdownSeconds: seconds,
          };

          if (state.mode === 'countdown' && !state.isRunning) {
            updates.pausedTime = computeCountdownTarget(
              state.countdownMinutes,
              seconds
            );
            updates.startTimestamp = null;
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

          const base =
            state.pausedTime ||
            computeCountdownTarget(state.countdownMinutes, state.countdownSeconds);
          const startTimestamp = now + base;

          return {
            isRunning: true,
            startTimestamp,
            pausedTime: base,
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

          const target = computeCountdownTarget(
            state.countdownMinutes,
            state.countdownSeconds
          );

          return {
            isRunning: false,
            startTimestamp: null,
            pausedTime: target,
          };
        }),
      setStartTimestamp: (startTimestamp) => set({ startTimestamp }),
      setIsRunning: (isRunning) => set({ isRunning }),
      setPausedTime: (pausedTime) => set({ pausedTime }),
    }),
    {
      name: 'timer-state',
      version: 1,
      partialize: (state) => ({
        mode: state.mode,
        isRunning: state.isRunning,
        countdownMinutes: state.countdownMinutes,
        countdownSeconds: state.countdownSeconds,
        startTimestamp: state.startTimestamp,
        pausedTime: state.pausedTime,
      }),
    }
  )
);

