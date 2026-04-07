import { create } from 'zustand';
import settingsService from '../services/settingsService';

const useSettingsStore = create((set) => ({
  settings: null,
  licenseWarnings: [],
  isLoading: false,
  sectionLoading: {},

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await settingsService.getAll();
      set({ settings: res.data.data });
    } catch {
      // settings may not exist yet
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSection: async (section) => {
    set((s) => ({ sectionLoading: { ...s.sectionLoading, [section]: true } }));
    try {
      const res = await settingsService.getSection(section);
      set((s) => ({
        settings: { ...s.settings, [section]: res.data.data },
        sectionLoading: { ...s.sectionLoading, [section]: false },
      }));
    } catch {
      set((s) => ({ sectionLoading: { ...s.sectionLoading, [section]: false } }));
    }
  },

  initializeSettings: async () => {
    const res = await settingsService.initialize();
    set({ settings: res.data.data });
    return res.data;
  },

  updateSection: async (section, data, serviceFn) => {
    const res = await serviceFn(data);
    set((s) => ({
      settings: { ...s.settings, [section]: { ...s.settings?.[section], ...data } },
    }));
    return res.data;
  },

  fetchLicenseWarnings: async () => {
    try {
      const res = await settingsService.getLicenseWarnings();
      set({ licenseWarnings: res.data.data });
    } catch {
      // ignore
    }
  },
}));

export default useSettingsStore;
