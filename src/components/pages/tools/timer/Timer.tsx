import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Timer as TimerIcon,
  Trash,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useTimerStore,
  type TimerMode,
  type SportsPhase,
  type SportsWorkoutConfig,
} from '@/stores/timerStore';

const WORKOUTS_STORAGE_KEY = 'timer-saved-workouts';

const formatDisplay = (value: number) => String(value).padStart(2, '0');

const formatWorkoutDuration = (minutes: number, seconds: number) =>
  `${formatDisplay(minutes)}:${formatDisplay(seconds)}`;

type SavedWorkout = SportsWorkoutConfig & {
  id: string;
  name: string;
  createdAt: number;
};

const Timer = () => {
  const { t } = useTranslation();
  const mode = useTimerStore((state) => state.mode);
  const isRunning = useTimerStore((state) => state.isRunning);
  const countdownMinutes = useTimerStore((state) => state.countdownMinutes);
  const countdownSeconds = useTimerStore((state) => state.countdownSeconds);
  const startTimestamp = useTimerStore((state) => state.startTimestamp);
  const pausedTime = useTimerStore((state) => state.pausedTime);
  const sportsTotalSets = useTimerStore((state) => state.sportsTotalSets);
  const sportsWorkMinutes = useTimerStore((state) => state.sportsWorkMinutes);
  const sportsWorkSeconds = useTimerStore((state) => state.sportsWorkSeconds);
  const sportsRestMinutes = useTimerStore((state) => state.sportsRestMinutes);
  const sportsRestSeconds = useTimerStore((state) => state.sportsRestSeconds);
  const sportsCurrentSet = useTimerStore((state) => state.sportsCurrentSet);
  const sportsPhase = useTimerStore((state) => state.sportsPhase);
  const setMode = useTimerStore((state) => state.setMode);
  const setCountdownMinutes = useTimerStore(
    (state) => state.setCountdownMinutes
  );
  const setCountdownSeconds = useTimerStore(
    (state) => state.setCountdownSeconds
  );
  const setSportsTotalSets = useTimerStore((state) => state.setSportsTotalSets);
  const setSportsWorkMinutes = useTimerStore(
    (state) => state.setSportsWorkMinutes
  );
  const setSportsWorkSeconds = useTimerStore(
    (state) => state.setSportsWorkSeconds
  );
  const setSportsRestMinutes = useTimerStore(
    (state) => state.setSportsRestMinutes
  );
  const setSportsRestSeconds = useTimerStore(
    (state) => state.setSportsRestSeconds
  );
  const start = useTimerStore((state) => state.start);
  const pause = useTimerStore((state) => state.pause);
  const reset = useTimerStore((state) => state.reset);
  const advanceSportsPhase = useTimerStore((state) => state.advanceSportsPhase);
  const loadSportsWorkout = useTimerStore((state) => state.loadSportsWorkout);
  const intervalRef = useRef<number | null>(null);

  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null
  );
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [workoutNameInput, setWorkoutNameInput] = useState('');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepSecondRef = useRef<number | null>(null);

  const playBeep = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) {
      return;
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.26);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(WORKOUTS_STORAGE_KEY);
      if (stored) {
        const parsed: SavedWorkout[] = JSON.parse(stored);
        setSavedWorkouts(parsed);
        if (parsed.length > 0) {
          setSelectedWorkoutId(parsed[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load saved workouts from localStorage', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (savedWorkouts.length === 0) {
      window.localStorage.removeItem(WORKOUTS_STORAGE_KEY);
      return;
    }
    try {
      window.localStorage.setItem(
        WORKOUTS_STORAGE_KEY,
        JSON.stringify(savedWorkouts)
      );
    } catch (error) {
      console.error('Failed to persist workouts to localStorage', error);
    }
  }, [savedWorkouts]);

  const countdownTarget = useMemo(
    () => (countdownMinutes * 60 + countdownSeconds) * 1000,
    [countdownMinutes, countdownSeconds]
  );

  const computeDisplayTime = useCallback(() => {
    if (isRunning && startTimestamp !== null) {
      if (mode === 'stopwatch') {
        return Math.max(0, Date.now() - startTimestamp);
      }

      return Math.max(0, startTimestamp - Date.now());
    }

    if (mode === 'countdown') {
      const fallbackTarget = countdownTarget;
      const safePaused = pausedTime ?? fallbackTarget;
      return Math.max(0, safePaused);
    }

    return Math.max(0, pausedTime);
  }, [countdownTarget, isRunning, mode, pausedTime, startTimestamp]);

  const [time, setTime] = useState(() => computeDisplayTime());

  const syncDisplayTime = useCallback(() => {
    const next = computeDisplayTime();
    setTime((prev) => (prev === next ? prev : next));
  }, [computeDisplayTime]);

  const sportsPhaseLabels: Record<SportsPhase, string> = {
    idle: t('timer.sports.phase.idle'),
    work: t('timer.sports.phase.work'),
    rest: t('timer.sports.phase.rest'),
    finished: t('timer.sports.phase.finished'),
  };

  useEffect(() => {
    if (!isRunning || mode !== 'sports') {
      lastBeepSecondRef.current = null;
    }
  }, [isRunning, mode]);

  useEffect(() => {
    if (isRunning && startTimestamp !== null) {
      const tick = () => {
        if (mode === 'stopwatch') {
          setTime(Date.now() - startTimestamp);
          return;
        }

        const now = Date.now();
        const remaining = startTimestamp - now;
        if (
          mode === 'sports' &&
          (sportsPhase === 'work' || sportsPhase === 'rest')
        ) {
          const secondsLeft = Math.ceil(remaining / 1000);
          if (secondsLeft <= 5 && secondsLeft > 0) {
            if (lastBeepSecondRef.current !== secondsLeft) {
              lastBeepSecondRef.current = secondsLeft;
              playBeep();
            }
          } else if (secondsLeft > 5) {
            lastBeepSecondRef.current = null;
          }
        }
        if (remaining <= 0) {
          setTime(0);
          lastBeepSecondRef.current = null;
          if (mode === 'sports') {
            advanceSportsPhase(now);
          } else {
            useTimerStore.setState({
              isRunning: false,
              startTimestamp: null,
              pausedTime: 0,
            });
          }

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        setTime(remaining);
      };

      tick();
      intervalRef.current = window.setInterval(tick, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastBeepSecondRef.current = null;
      syncDisplayTime();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    advanceSportsPhase,
    isRunning,
    mode,
    playBeep,
    sportsPhase,
    startTimestamp,
    syncDisplayTime,
  ]);

  useEffect(() => {
    if (isRunning && startTimestamp === null) {
      useTimerStore.setState({ isRunning: false });
      syncDisplayTime();
    }
  }, [isRunning, startTimestamp, syncDisplayTime]);

  const handleStart = () => {
    const now = Date.now();
    start(now);
  };

  const handlePause = () => {
    const now = Date.now();
    pause(now);
  };

  const handleReset = () => {
    reset();
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
  };

  useEffect(() => {
    if (!isRunning) {
      syncDisplayTime();
    }
  }, [
    countdownMinutes,
    countdownSeconds,
    isRunning,
    mode,
    pausedTime,
    sportsCurrentSet,
    sportsPhase,
    sportsRestMinutes,
    sportsRestSeconds,
    sportsTotalSets,
    sportsWorkMinutes,
    sportsWorkSeconds,
    syncDisplayTime,
  ]);

  const openSaveDialog = () => {
    const defaultName = t('timer.workouts.defaultName', {
      index: savedWorkouts.length + 1,
    });
    setWorkoutNameInput(defaultName);
    setIsSaveDialogOpen(true);
  };

  const handleConfirmSaveWorkout = () => {
    const finalName = workoutNameInput.trim();
    const nameToUse =
      finalName.length > 0
        ? finalName
        : t('timer.workouts.defaultName', {
            index: savedWorkouts.length + 1,
          });

    const newWorkout: SavedWorkout = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `workout-${Date.now()}`,
      name: nameToUse,
      createdAt: Date.now(),
      totalSets: sportsTotalSets,
      workMinutes: sportsWorkMinutes,
      workSeconds: sportsWorkSeconds,
      restMinutes: sportsRestMinutes,
      restSeconds: sportsRestSeconds,
    };

    setSavedWorkouts((prev) => [newWorkout, ...prev]);
    setSelectedWorkoutId(newWorkout.id);
    setIsSaveDialogOpen(false);
  };

  const handleDeleteWorkout = (id: string) => {
    setSavedWorkouts((prev) => prev.filter((workout) => workout.id !== id));
    setSelectedWorkoutId((prev) => (prev === id ? null : prev));
  };

  const handleSelectWorkout = (workout: SavedWorkout) => {
    const { id, createdAt, name, ...config } = workout;
    loadSportsWorkout(config);
    setSelectedWorkoutId(workout.id);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}.${String(centiseconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const [inputState, setInputState] = useState({
    countdownMinutes: countdownMinutes.toString(),
    countdownSeconds: countdownSeconds.toString().padStart(2, '0'),
    sportsWorkMinutes: sportsWorkMinutes.toString(),
    sportsWorkSeconds: sportsWorkSeconds.toString().padStart(2, '0'),
    sportsRestMinutes: sportsRestMinutes.toString(),
    sportsRestSeconds: sportsRestSeconds.toString().padStart(2, '0'),
  });

  useEffect(() => {
    setInputState((prev) => ({
      ...prev,
      countdownMinutes: countdownMinutes.toString(),
      countdownSeconds: countdownSeconds.toString().padStart(2, '0'),
      sportsWorkMinutes: sportsWorkMinutes.toString(),
      sportsWorkSeconds: sportsWorkSeconds.toString().padStart(2, '0'),
      sportsRestMinutes: sportsRestMinutes.toString(),
      sportsRestSeconds: sportsRestSeconds.toString().padStart(2, '0'),
    }));
  }, [
    countdownMinutes,
    countdownSeconds,
    sportsWorkMinutes,
    sportsWorkSeconds,
    sportsRestMinutes,
    sportsRestSeconds,
  ]);

  const clampValue = (value: string, max: number) => {
    const numeric = parseInt(value, 10);
    if (isNaN(numeric)) {
      return 0;
    }
    return Math.max(0, Math.min(max, numeric));
  };

  const handleCountdownMinutesChange = (raw: string) => {
    setInputState((prev) => ({ ...prev, countdownMinutes: raw }));
    const value = clampValue(raw, 99);
    setCountdownMinutes(value);
  };

  const handleCountdownSecondsChange = (raw: string) => {
    setInputState((prev) => ({ ...prev, countdownSeconds: raw }));
    const value = clampValue(raw, 59);
    setCountdownSeconds(value);
  };

  const handleSportsWorkMinutesChange = (raw: string) => {
    setInputState((prev) => ({ ...prev, sportsWorkMinutes: raw }));
    const value = clampValue(raw, 99);
    setSportsWorkMinutes(value);
  };

  const handleSportsWorkSecondsChange = (raw: string) => {
    setInputState((prev) => ({ ...prev, sportsWorkSeconds: raw }));
    const value = clampValue(raw, 59);
    setSportsWorkSeconds(value);
  };

  const handleSportsRestMinutesChange = (raw: string) => {
    setInputState((prev) => ({ ...prev, sportsRestMinutes: raw }));
    const value = clampValue(raw, 99);
    setSportsRestMinutes(value);
  };

  const handleSportsRestSecondsChange = (raw: string) => {
    setInputState((prev) => ({ ...prev, sportsRestSeconds: raw }));
    const value = clampValue(raw, 59);
    setSportsRestSeconds(value);
  };

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TimerIcon className="h-8 w-8" />
          {t('timer.title')}
        </h1>
        <p className="text-muted-foreground">{t('timer.description')}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="p-6 space-y-6 lg:flex-1 lg:min-h-128">
          <div className="space-y-2">
            <Label>{t('timer.mode')}</Label>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stopwatch">
                  {t('timer.modes.stopwatch')}
                </SelectItem>
                <SelectItem value="countdown">
                  {t('timer.modes.countdown')}
                </SelectItem>
                <SelectItem value="sports">
                  {t('timer.modes.sports')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'countdown' && !isRunning && (
            <div className="space-y-2">
              <Label>{t('timer.duration')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={inputState.countdownMinutes}
                  onChange={(e) => handleCountdownMinutesChange(e.target.value)}
                  disabled={isRunning}
                  placeholder="00"
                  className="w-20 text-center text-2xl font-mono"
                />
                <span className="text-2xl font-semibold text-muted-foreground">
                  :
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={inputState.countdownSeconds}
                  onChange={(e) => handleCountdownSecondsChange(e.target.value)}
                  disabled={isRunning}
                  placeholder="00"
                  className="w-20 text-center text-2xl font-mono"
                />
              </div>
            </div>
          )}

          {mode === 'sports' && (
            <div className="space-y-6">
              <div className="space-y-4 rounded-md border border-border/60 p-4">
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <Label>{t('timer.sports.sets')}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={sportsTotalSets}
                      onChange={(e) =>
                        setSportsTotalSets(
                          Math.max(
                            1,
                            Math.min(99, parseInt(e.target.value) || 0)
                          )
                        )
                      }
                      disabled={isRunning}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t('timer.sports.work')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={inputState.sportsWorkMinutes}
                        onChange={(e) =>
                          handleSportsWorkMinutesChange(e.target.value)
                        }
                        disabled={isRunning}
                        placeholder="00"
                        className="w-20 text-center text-2xl font-mono"
                      />
                      <span className="text-2xl font-semibold text-muted-foreground">
                        :
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={inputState.sportsWorkSeconds}
                        onChange={(e) =>
                          handleSportsWorkSecondsChange(e.target.value)
                        }
                        disabled={isRunning}
                        placeholder="00"
                        className="w-20 text-center text-2xl font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t('timer.sports.rest')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={inputState.sportsRestMinutes}
                        onChange={(e) =>
                          handleSportsRestMinutesChange(e.target.value)
                        }
                        disabled={isRunning}
                        placeholder="00"
                        className="w-20 text-center text-2xl font-mono"
                      />
                      <span className="text-2l font-semibold text-muted-foreground">
                        :
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={inputState.sportsRestSeconds}
                        onChange={(e) =>
                          handleSportsRestSecondsChange(e.target.value)
                        }
                        disabled={isRunning}
                        placeholder="00"
                        className="w-20 text-center text-2xl font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full max-w-xs"
                    onClick={openSaveDialog}
                    disabled={isRunning || mode !== 'sports'}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {t('timer.workouts.saveButton')}
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 rounded-md border border-border/60 p-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">
                    {t('timer.sports.status.set')}
                  </Label>
                  <p className="text-base font-semibold">
                    {t('timer.sports.currentSet', {
                      current: Math.min(sportsCurrentSet, sportsTotalSets),
                      total: sportsTotalSets,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">
                    {t('timer.sports.status.phase')}
                  </Label>
                  <p className="text-base font-semibold">
                    {t('timer.sports.currentPhase', {
                      phase: sportsPhaseLabels[sportsPhase],
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <div
              className={`text-6xl sm:text-8xl font-mono font-bold ${
                mode === 'countdown' && time < 60000 && time > 0
                  ? 'text-destructive animate-pulse'
                  : 'text-foreground'
              }`}
            >
              {formatTime(time)}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button onClick={handleStart} size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                {t('timer.start')}
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                <Pause className="h-5 w-5" />
                {t('timer.pause')}
              </Button>
            )}
            <Button
              onClick={handleReset}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              {t('timer.reset')}
            </Button>
          </div>

          {mode === 'countdown' &&
            time === 0 &&
            !isRunning &&
            countdownTarget > 0 && (
              <div className="text-center text-lg font-semibold text-destructive">
                {t('timer.finished')}
              </div>
            )}
          {mode === 'sports' && sportsPhase === 'finished' && !isRunning && (
            <div className="text-center text-lg font-semibold text-emerald-500">
              {t('timer.sports.completed')}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-4 lg:w-64 lg:shrink-0 lg:min-h-128">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {t('timer.workouts.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('timer.workouts.localInfo')}
            </p>
          </div>
          {savedWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('timer.workouts.empty')}
            </p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {savedWorkouts.map((workout) => {
                const isSelected = selectedWorkoutId === workout.id;
                return (
                  <ButtonGroup
                    key={workout.id}
                    className={`w-full overflow-hidden rounded-md border transition ${
                      isSelected
                        ? 'border-border bg-muted/70 text-foreground shadow-sm'
                        : 'border-border/70 bg-background'
                    }`}
                  >
                    <Button
                      variant={isSelected ? 'secondary' : 'ghost'}
                      size="lg"
                      className={`flex-1 justify-start text-left ${
                        isSelected
                          ? 'text-foreground hover:text-foreground'
                          : 'text-foreground hover:text-foreground'
                      }`}
                      onClick={() => handleSelectWorkout(workout)}
                    >
                      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                        <span className="truncate font-medium">
                          {workout.name}
                        </span>
                        <span
                          className={`truncate text-xs ${
                            isSelected
                              ? 'text-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {t('timer.workouts.summary', {
                            sets: workout.totalSets,
                            work: formatWorkoutDuration(
                              workout.workMinutes,
                              workout.workSeconds
                            ),
                            rest: formatWorkoutDuration(
                              workout.restMinutes,
                              workout.restSeconds
                            ),
                          })}
                        </span>
                      </div>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-none border-l border-border/70 hover:bg-destructive/15"
                      onClick={() => handleDeleteWorkout(workout.id)}
                    >
                      <span className="sr-only">
                        {t('timer.workouts.delete')}
                      </span>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </ButtonGroup>
                );
              })}
            </div>
          )}
        </Card>
      </div>
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('timer.workouts.dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('timer.workouts.dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="workout-name-input">
              {t('timer.workouts.dialog.label')}
            </Label>
            <Input
              id="workout-name-input"
              value={workoutNameInput}
              onChange={(e) => setWorkoutNameInput(e.target.value)}
              placeholder={t('timer.workouts.dialog.placeholder')}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              {t('timer.workouts.dialog.cancel')}
            </Button>
            <Button onClick={handleConfirmSaveWorkout}>
              {t('timer.workouts.dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timer;
