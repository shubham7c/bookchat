import { useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';

// ─── LIGHT THEME ──────────────────────────────────────────────────────────────
const LIGHT = {
  '--bc-bg':           '#faf6ef',
  '--bc-bg-card':      'rgba(255,255,248,0.97)',
  '--bc-bg-card2':     'rgba(245,240,232,0.8)',
  '--bc-bg-input':     '#f5f0e8',
  '--bc-bg-input-focus': '#fffdf8',
  '--bc-bg-chip':      'rgba(245,240,232,0.8)',
  '--bc-bg-hover':     'rgba(196,122,30,0.04)',

  '--bc-border':       'rgba(196,122,30,0.12)',
  '--bc-border-card':  'rgba(196,122,30,0.09)',
  '--bc-border-focus': 'rgba(196,122,30,0.45)',
  '--bc-border-input': 'rgba(196,122,30,0.18)',

  '--bc-amber':        '#c47a1e',
  '--bc-amber-light':  '#e8a840',
  '--bc-amber-dim':    'rgba(196,122,30,0.12)',
  '--bc-amber-glow':   'rgba(196,122,30,0.28)',

  '--bc-text-primary':   '#1a1208',
  '--bc-text-secondary': '#3a2e20',
  '--bc-text-muted':     '#8a7560',
  '--bc-text-faint':     '#b0a090',
  '--bc-text-amber':     '#8b5e00',

  '--bc-shadow-card':  '0 4px 20px rgba(0,0,0,0.05), 0 1px 4px rgba(196,122,30,0.04)',
  '--bc-shadow-float': '0 20px 60px rgba(0,0,0,0.08), 0 4px 14px rgba(196,122,30,0.06)',
  '--bc-shadow-btn':   '0 6px 24px rgba(196,122,30,0.28), inset 0 1px 0 rgba(255,255,255,0.15)',

  '--bc-overlay':      'rgba(10,7,3,0.65)',
  '--bc-blur':         'rgba(250,246,239,0.97)',
  '--bc-grid-line':    'rgba(196,122,30,0.022)',
  '--bc-shimmer-top':  'rgba(196,122,30,0.2)',

  // Action colours
  '--bc-like':         '#d03535',
  '--bc-like-bg':      'rgba(210,55,55,0.07)',
  '--bc-danger':       '#c03228',
  '--bc-danger-bg':    'rgba(192,50,40,0.04)',
  '--bc-danger-border':'rgba(192,50,40,0.12)',
  '--bc-success':      '#2a6a1a',
};

// ─── DARK THEME ───────────────────────────────────────────────────────────────
const DARK = {
  '--bc-bg':           '#0f0d09',
  '--bc-bg-card':      'rgba(26,20,12,0.97)',
  '--bc-bg-card2':     'rgba(32,26,16,0.9)',
  '--bc-bg-input':     '#1e1810',
  '--bc-bg-input-focus': '#231d12',
  '--bc-bg-chip':      'rgba(38,30,18,0.9)',
  '--bc-bg-hover':     'rgba(196,122,30,0.07)',

  '--bc-border':       'rgba(196,122,30,0.18)',
  '--bc-border-card':  'rgba(196,122,30,0.14)',
  '--bc-border-focus': 'rgba(196,122,30,0.55)',
  '--bc-border-input': 'rgba(196,122,30,0.25)',

  '--bc-amber':        '#e8a840',
  '--bc-amber-light':  '#f0c060',
  '--bc-amber-dim':    'rgba(232,168,64,0.14)',
  '--bc-amber-glow':   'rgba(232,168,64,0.22)',

  '--bc-text-primary':   '#f0e8d8',
  '--bc-text-secondary': '#d4c4a8',
  '--bc-text-muted':     '#8a7a60',
  '--bc-text-faint':     '#5a4e3a',
  '--bc-text-amber':     '#e8a840',

  '--bc-shadow-card':  '0 4px 20px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.25)',
  '--bc-shadow-float': '0 20px 60px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.35)',
  '--bc-shadow-btn':   '0 6px 24px rgba(232,168,64,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',

  '--bc-overlay':      'rgba(0,0,0,0.8)',
  '--bc-blur':         'rgba(15,13,9,0.97)',
  '--bc-grid-line':    'rgba(196,122,30,0.035)',
  '--bc-shimmer-top':  'rgba(196,122,30,0.15)',

  '--bc-like':         '#e05050',
  '--bc-like-bg':      'rgba(224,80,80,0.1)',
  '--bc-danger':       '#e04040',
  '--bc-danger-bg':    'rgba(224,60,48,0.08)',
  '--bc-danger-border':'rgba(224,60,48,0.2)',
  '--bc-success':      '#3a8a28',
};

export function ThemeProvider({ children }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const vars = theme === 'dark' ? DARK : LIGHT;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', theme);
    // Also set meta theme-color for mobile browser chrome
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0f0d09' : '#faf6ef');
  }, [theme]);

  return children;
}