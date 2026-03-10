import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

// ─── INLINE TOGGLE (compact, for Profile settings row) ────────────────────────
export function ThemeToggle({ compact = false }) {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  if (compact) {
    return (
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.93 }}
        style={{
          position: 'relative',
          width: 52, height: 28,
          borderRadius: 14,
          background: isDark
            ? 'linear-gradient(135deg,#1a1410,#2a2010)'
            : 'linear-gradient(135deg,#fdf5e0,#f0dda0)',
          border: `1.5px solid ${isDark ? 'rgba(232,168,64,0.35)' : 'rgba(196,122,30,0.3)'}`,
          cursor: 'pointer',
          boxShadow: isDark
            ? 'inset 0 1px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
            : 'inset 0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(196,122,30,0.12)',
          transition: 'all 0.35s ease',
          overflow: 'hidden',
        }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* Track stars (dark) / rays (light) */}
        <AnimatePresence>
          {isDark && (
            <motion.div key="stars"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {[[8,7],[38,12],[18,18],[42,20]].map(([x,y],i) => (
                <motion.div key={i}
                  animate={{ opacity: [0.4,1,0.4], scale: [0.8,1.2,0.8] }}
                  transition={{ duration: 1.5+i*0.4, repeat: Infinity, delay: i*0.3 }}
                  style={{ position:'absolute', left:x, top:y, width:2, height:2, borderRadius:'50%', background:'rgba(232,168,64,0.7)' }}/>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thumb */}
        <motion.div
          animate={{ x: isDark ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'absolute', top: 3,
            width: 20, height: 20, borderRadius: '50%',
            background: isDark
              ? 'linear-gradient(145deg,#e8a840,#c47a1e)'
              : 'linear-gradient(145deg,#fff8e0,#f5d060)',
            boxShadow: isDark
              ? '0 2px 8px rgba(232,168,64,0.5)'
              : '0 2px 8px rgba(196,122,30,0.3), inset 0 1px 0 rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.55rem',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span key={isDark ? 'moon' : 'sun'}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? '🌙' : '☀️'}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </motion.button>
    );
  }

  // ── Full size toggle (for settings panel / standalone use) ────────────────
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {['light','dark'].map((t) => {
        const isActive = theme === t;
        return (
          <motion.button key={t}
            onClick={() => useThemeStore.getState().setTheme(t)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            style={{
              flex: 1, padding: '11px 8px', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              cursor: 'pointer', fontFamily: 'Gilroy, sans-serif',
              fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
              background: isActive
                ? (t === 'dark'
                    ? 'linear-gradient(135deg,#1a1410,#2d2318)'
                    : 'linear-gradient(135deg,#fffdf0,#f5ead8)')
                : 'transparent',
              border: `1.5px solid ${isActive ? 'rgba(196,122,30,0.4)' : 'rgba(196,122,30,0.1)'}`,
              color: isActive ? 'var(--bc-text-primary)' : 'var(--bc-text-muted)',
              boxShadow: isActive ? 'var(--bc-shadow-card)' : 'none',
              transition: 'all 0.25s',
            }}>
            <span style={{ fontSize: '1rem' }}>{t === 'light' ? '☀️' : '🌙'}</span>
            {t === 'light' ? 'Light' : 'Dark'}
            {isActive && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ fontSize: '0.6rem', background: 'rgba(196,122,30,0.15)', color: 'var(--bc-amber)', padding: '1px 6px', borderRadius: 50, fontWeight: 800 }}>
                ON
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}