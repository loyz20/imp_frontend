import { useEffect } from 'react';
import useSettingsStore from '../store/settingsStore';
import useAuthStore from '../store/authStore';

/**
 * SettingsProvider — fetch settings saat user sudah login.
 * Juga set atribut HTML berdasarkan general settings (lang, timezone meta).
 */
export default function SettingsProvider({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const settings = useSettingsStore((s) => s.settings);

  // Fetch settings setelah login berhasil
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  // Terapkan language ke <html lang="...">
  useEffect(() => {
    const lang = settings?.general?.language ?? 'id';
    document.documentElement.lang = lang;
  }, [settings?.general?.language]);

  // Terapkan title dengan nama perusahaan
  useEffect(() => {
    const companyName = settings?.company?.name;
    if (companyName) {
      document.title = `${companyName} — SI-PBF`;
    }
  }, [settings?.company?.name]);

  return children;
}
