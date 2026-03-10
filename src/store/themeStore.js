import { create } from 'zustand';

const saved = localStorage.getItem('bc-theme') || 'light';

export const useThemeStore = create((set) => ({
  theme: saved, // 'light' | 'dark'
  setTheme: (theme) => {
    localStorage.setItem('bc-theme', theme);
    set({ theme });
  },
  toggle: () => set((s) => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('bc-theme', next);
    return { theme: next };
  }),
}));