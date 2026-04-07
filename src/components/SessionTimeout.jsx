import { useEffect, useRef, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { DEFAULT_SETTINGS } from '../constants/settings';
import toast from 'react-hot-toast';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
const WARNING_BEFORE_MS = 60_000; // warning 1 menit sebelum logout

/**
 * SessionTimeout — auto-logout user setelah tidak ada aktivitas
 * berdasarkan settings general.sessionTimeoutMinutes.
 */
export default function SessionTimeout() {
  const logout = useAuthStore((s) => s.logout);
  const settings = useSettingsStore((s) => s.settings);
  const timeoutMs = (settings?.general?.sessionTimeoutMinutes ?? DEFAULT_SETTINGS.general.sessionTimeoutMinutes) * 60 * 1000;

  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const hasWarnedRef = useRef(false);

  const handleLogout = useCallback(() => {
    toast.error('Sesi Anda telah berakhir karena tidak ada aktivitas.', { duration: 5000 });
    logout();
  }, [logout]);

  const resetTimers = useCallback(() => {
    // Clear timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    hasWarnedRef.current = false;

    // Set warning timer (1 menit sebelum timeout)
    const warningAt = Math.max(timeoutMs - WARNING_BEFORE_MS, 0);
    warningTimerRef.current = setTimeout(() => {
      if (!hasWarnedRef.current) {
        hasWarnedRef.current = true;
        toast('Sesi Anda akan berakhir dalam 1 menit. Lakukan aktivitas untuk memperpanjang.', {
          icon: '⏳',
          duration: 10000,
        });
      }
    }, warningAt);

    // Set logout timer
    logoutTimerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [timeoutMs, handleLogout]);

  useEffect(() => {
    // Initial timer
    resetTimers();

    // Reset on activity
    const onActivity = () => resetTimers();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [resetTimers]);

  return null; // Invisible component
}
