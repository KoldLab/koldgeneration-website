import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { Play, Pause, RotateCcw, Timer as TimerIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTimerStore, type TimerMode } from '@/stores/timerStore';

const Timer = () => {
  const { t } = useTranslation();
  const mode = useTimerStore((state) => state.mode);
  const isRunning = useTimerStore((state) => state.isRunning);
  const countdownMinutes = useTimerStore((state) => state.countdownMinutes);
  const countdownSeconds = useTimerStore((state) => state.countdownSeconds);
  const startTimestamp = useTimerStore((state) => state.startTimestamp);
  const pausedTime = useTimerStore((state) => state.pausedTime);
  const setMode = useTimerStore((state) => state.setMode);
  const setCountdownMinutes = useTimerStore(
    (state) => state.setCountdownMinutes
  );
  const setCountdownSeconds = useTimerStore(
    (state) => state.setCountdownSeconds
  );
  const start = useTimerStore((state) => state.start);
  const pause = useTimerStore((state) => state.pause);
  const reset = useTimerStore((state) => state.reset);
  const intervalRef = useRef<number | null>(null);

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
  }, [isRunning, startTimestamp, mode, pausedTime, countdownTarget]);

  const [time, setTime] = useState(() => computeDisplayTime());

  const syncDisplayTime = useCallback(() => {
    const next = computeDisplayTime();
    setTime((prev) => (prev === next ? prev : next));
  }, [computeDisplayTime]);

  useEffect(() => {
    if (isRunning && startTimestamp !== null) {
      const tick = () => {
      if (mode === 'stopwatch') {
          setTime(Date.now() - startTimestamp);
          return;
        }

        const remaining = startTimestamp - Date.now();
          if (remaining <= 0) {
            setTime(0);
          useTimerStore.setState({
            isRunning: false,
            startTimestamp: null,
            pausedTime: 0,
          });
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          } else {
            setTime(remaining);
          }
      };

      tick();
      intervalRef.current = window.setInterval(tick, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      syncDisplayTime();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isRunning,
    mode,
    syncDisplayTime,
    startTimestamp,
  ]);

  useEffect(() => {
    if (isRunning && startTimestamp === null) {
      // State is inconsistent; stop the timer gracefully.
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
    if (mode === 'countdown' && !isRunning) {
      syncDisplayTime();
    }
  }, [countdownMinutes, countdownSeconds, isRunning, mode, syncDisplayTime]);

  // Format time display
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TimerIcon className="h-8 w-8" />
          {t('timer.title')}
        </h1>
        <p className="text-muted-foreground">{t('timer.description')}</p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Mode Selection */}
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
            </SelectContent>
          </Select>
        </div>

        {/* Countdown Inputs */}
        {mode === 'countdown' && !isRunning && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('timer.minutes')}</Label>
              <Input
                type="number"
                min="0"
                max="99"
                value={countdownMinutes}
                onChange={(e) =>
                  setCountdownMinutes(Math.max(0, parseInt(e.target.value) || 0))
                }
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('timer.seconds')}</Label>
              <Input
                type="number"
                min="0"
                max="59"
                value={countdownSeconds}
                onChange={(e) => {
                  const val = Math.max(
                    0,
                    Math.min(59, parseInt(e.target.value) || 0)
                  );
                  setCountdownSeconds(val);
                }}
                disabled={isRunning}
              />
            </div>
          </div>
        )}

        {/* Timer Display */}
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

        {/* Controls */}
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

        {/* Countdown Finished Message */}
        {mode === 'countdown' &&
          time === 0 &&
          !isRunning &&
          countdownTarget > 0 && (
            <div className="text-center text-lg font-semibold text-destructive">
              {t('timer.finished')}
            </div>
          )}
      </Card>
    </div>
  );
};

export default Timer;
