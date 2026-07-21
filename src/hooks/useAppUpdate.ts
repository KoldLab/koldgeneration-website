import { useCallback, useEffect, useState } from 'react';

// Injected at build time by Vite (see vite.config.ts). Same value written to
// dist/version.json, so the running client can compare its own build against
// the one currently deployed.
declare const __GIT_COMMIT_HASH__: string;

const CURRENT_COMMIT =
  typeof __GIT_COMMIT_HASH__ !== 'undefined' ? __GIT_COMMIT_HASH__ : 'dev';
const POLL_INTERVAL = 5 * 60 * 1000; // 5 min

/**
 * Detects that a newer build has been deployed while the page is still open
 * (e.g. a tab left open for hours, or a PWA on mobile).
 *
 * Polls /version.json (never cached) and compares its commit hash to the one
 * embedded in the current bundle. No server infra required — a periodic poll,
 * plus a check whenever the tab regains focus, is enough for a static SPA.
 */
export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // In dev (or when the hash couldn't be resolved) the comparison is moot.
    if (CURRENT_COMMIT === 'dev' || CURRENT_COMMIT === 'unknown') return;
    let cancelled = false;

    const check = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch(`/version.json?ts=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { commit?: string };
        if (!cancelled && data.commit && data.commit !== CURRENT_COMMIT) {
          setUpdateAvailable(true);
        }
      } catch {
        // Offline or transient error: we'll retry on the next tick.
      }
    };

    check();
    const intervalId = window.setInterval(check, POLL_INTERVAL);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  /** Purge service workers + caches (defensive), then reload the latest build. */
  const hardRefresh = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Reload regardless.
    } finally {
      window.location.reload();
    }
  }, []);

  return { updateAvailable, hardRefresh };
}
