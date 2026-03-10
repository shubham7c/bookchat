import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "../../store/themeStore";

// ─── ICONS — Pinterest style: thin stroke outline → solid fill on active ──────
// Pinterest icons are characterised by:
//  • ~1.5–1.8px strokes, rounded caps/joins
//  • NO background pill / box on inactive
//  • Solid fill (same colour as stroke) on active
//  • Very clean, geometric shapes

const HomeIcon = ({ active, c }) => active ? (
  // Filled house
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill={c}/>
  </svg>
) : (
  // Outline house
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 4L21 12V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V12Z"
      stroke={c} strokeWidth="1.65" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M9 21V16H15V21" stroke={c} strokeWidth="1.65" strokeLinejoin="round"/>
  </svg>
);

const ExploreIcon = ({ active, c }) => active ? (
  // Filled compass / target look
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" fill={c}/>
    <circle cx="11" cy="11" r="3.2" fill="var(--bc-nav-bg)"/>
    <circle cx="11" cy="11" r="1.2" fill={c}/>
    <path d="M17 17L21 21" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" stroke={c} strokeWidth="1.65"/>
    <path d="M17 17L21 21" stroke={c} strokeWidth="1.65" strokeLinecap="round"/>
  </svg>
);

const ChatIcon = ({ active, c }) => active ? (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
      fill={c} strokeLinejoin="round"/>
    <line x1="7.5" y1="9" x2="16.5" y2="9" stroke="var(--bc-nav-bg)" strokeWidth="1.7" strokeLinecap="round"/>
    <line x1="7.5" y1="13" x2="13" y2="13" stroke="var(--bc-nav-bg)" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
      stroke={c} strokeWidth="1.65" strokeLinejoin="round"/>
    <line x1="7.5" y1="9" x2="16.5" y2="9" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="7.5" y1="13" x2="13" y2="13" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const MeIcon = ({ active, c }) => active ? (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7.5" r="4.5" fill={c}/>
    <circle cx="12" cy="7.5" r="2" fill="var(--bc-nav-bg)"/>
    <path d="M4 21C4 17.69 7.58 15 12 15C16.42 15 20 17.69 20 21"
      stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7.5" r="4.5" stroke={c} strokeWidth="1.65"/>
    <path d="M4 21C4 17.69 7.58 15 12 15C16.42 15 20 17.69 20 21"
      stroke={c} strokeWidth="1.65" strokeLinecap="round"/>
  </svg>
);

const NAV_ITEMS = [
  { id: "home",    label: "Home",    path: "/home",    Icon: HomeIcon    },
  { id: "explore", label: "Explore", path: "/explore", Icon: ExploreIcon },
  { id: "post",    label: "",        path: null,       Icon: null        },
  { id: "chat",    label: "Chat",    path: "/chat",    Icon: ChatIcon    },
  { id: "profile", label: "Me",      path: "/profile", Icon: MeIcon      },
];

const FAB_OPTIONS = [
  { emoji: "📖", label: "Book Spark",    sub: "Share a thought about a book",  color: "#c47a1e" },
  { emoji: "✒️", label: "Write Excerpt", sub: "Share a piece of your writing", color: "#7b4fa8" },
  { emoji: "⭐", label: "Recommend",     sub: "A book you loved",              color: "#2a7a5a" },
  { emoji: "👥", label: "Activity",      sub: "What you're reading now",       color: "#3a6a9a" },
];

export default function BottomNav({ active = "home" }) {
  const navigate      = useNavigate();
  const { theme }     = useThemeStore();
  const isDark        = theme === "dark";
  const [fab, setFab] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      if (!fab) setHidden(y > lastY.current && y > 100);
      lastY.current = y;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [fab]);

  // These are the critical values — FULLY OPAQUE so no bleed-through
  const navBg       = isDark ? "#0f0d09"  : "#faf6ef";
  const navBorder   = isDark ? "rgba(196,122,30,0.2)" : "rgba(196,122,30,0.12)";
  const navShadow   = isDark
    ? "0 -2px 20px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(196,122,30,0.15)"
    : "0 -2px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(196,122,30,0.1)";

  const inactiveC   = isDark ? "#4a3e2c" : "#b0987a";
  const activeC     = isDark ? "#e8a840" : "#c47a1e";
  const activeGlow  = isDark ? "rgba(232,168,64,0.12)" : "rgba(196,122,30,0.09)";
  const labelActive = isDark ? "#e8a840" : "#c47a1e";
  const labelOff    = isDark ? "#3a3020" : "#c0aa88";

  // Gradient fade above nav — matches page background exactly
  const fadeBg      = isDark
    ? "linear-gradient(to top, #0f0d09 60%, transparent)"
    : "linear-gradient(to top, #faf6ef 60%, transparent)";

  const fabMenuBg   = isDark ? "#1a1208" : "#fffcf5";
  const fabTextP    = isDark ? "#f0e8d8" : "#1a1208";
  const fabTextS    = isDark ? "#6a5a40" : "#9a8870";

  return (
    <>
      {/* CSS variable for icon bg cutout */}
      <style>{`
        :root { --bc-nav-bg: ${navBg}; }
        body { --bc-nav-bg: ${navBg}; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Backdrop */}
      <AnimatePresence>
        {fab && (
          <motion.div key="bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setFab(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 48,
              background: isDark ? "rgba(0,0,0,0.82)" : "rgba(8,5,2,0.55)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* FAB Menu */}
      <AnimatePresence>
        {fab && (
          <div style={{
            position: "fixed", bottom: 94, left: "50%",
            transform: "translateX(-50%)",
            zIndex: 49, width: "min(296px, calc(100vw - 32px))",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {FAB_OPTIONS.map((opt, i) => (
              <motion.button key={opt.label}
                initial={{ opacity: 0, y: 18, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.94 }}
                transition={{ delay: (FAB_OPTIONS.length - 1 - i) * 0.05, duration: 0.26, ease: [0.16,1,0.3,1] }}
                whileHover={{ scale: 1.025, x: 4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setFab(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "13px 15px", borderRadius: 18,
                  background: fabMenuBg,
                  border: `1px solid ${isDark ? opt.color + "28" : "rgba(0,0,0,0.06)"}`,
                  boxShadow: isDark
                    ? "0 6px 32px rgba(0,0,0,0.65)"
                    : "0 6px 32px rgba(0,0,0,0.12)",
                  cursor: "pointer", textAlign: "left",
                  fontFamily: "Gilroy, sans-serif",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: opt.color + "15",
                  border: `1px solid ${opt.color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.2rem", flexShrink: 0,
                }}>
                  {opt.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.87rem", fontWeight: 700, color: fabTextP, letterSpacing: "-0.01em" }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: "0.67rem", color: fabTextS, marginTop: 2 }}>
                    {opt.sub}
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke={opt.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Nav bar */}
      <motion.nav
        animate={{ y: hidden && !fab ? 110 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 50, pointerEvents: "none",
        }}
      >
        {/* Fade above — solid gradient to hide content bleed */}
        <div style={{
          position: "absolute", bottom: "100%", left: 0, right: 0,
          height: 52, background: fadeBg,
          pointerEvents: "none",
        }}/>

        {/* Pill */}
        <div style={{
          pointerEvents: "all",
          margin: "0 10px 10px",
          background: navBg,
          border: `1px solid ${navBorder}`,
          borderRadius: 26,
          padding: "8px 4px 7px",
          display: "flex", alignItems: "center",
          boxShadow: navShadow,
          transition: "background 0.3s, border-color 0.3s",
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;

            // FAB
            if (item.id === "post") return (
              <div key="fab" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <motion.button
                  onClick={() => setFab(p => !p)}
                  whileTap={{ scale: 0.88 }}
                  style={{
                    width: 50, height: 50, borderRadius: 17,
                    background: fab
                      ? (isDark ? "#1e1508" : "#2a1500")
                      : "linear-gradient(145deg, #b86810, #c47a1e, #de8f2a)",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: fab
                      ? "none"
                      : "0 4px 18px rgba(196,122,30,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
                    transition: "background 0.28s, box-shadow 0.28s",
                    position: "relative",
                  }}
                >
                  {/* Pulse ring */}
                  {!fab && (
                    <motion.div
                      animate={{ scale: [1, 1.7, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                      style={{
                        position: "absolute", inset: -5, borderRadius: 22,
                        border: "1.5px solid rgba(196,122,30,0.4)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  <motion.div
                    animate={{ rotate: fab ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                </motion.button>
              </div>
            );

            const { Icon } = item;
            return (
              <motion.button key={item.id}
                onClick={() => item.path && navigate(item.path)}
                whileTap={{ scale: 0.82 }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 3, padding: "3px 2px 2px",
                  background: "none", border: "none", cursor: "pointer",
                  position: "relative", outline: "none",
                }}
              >
                {/* Active glow pill — Pinterest places this BEHIND the icon */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div key="pill"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      style={{
                        position: "absolute", top: 1,
                        width: 40, height: 34,
                        borderRadius: 12,
                        background: activeGlow,
                        zIndex: 0,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  style={{ position: "relative", zIndex: 1 }}
                >
                  <Icon active={isActive} c={isActive ? activeC : inactiveC} />
                </motion.div>

                {/* Label */}
                <span style={{
                  fontSize: "0.56rem",
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? labelActive : labelOff,
                  letterSpacing: isActive ? "0.04em" : "0.025em",
                  fontFamily: "Gilroy, sans-serif",
                  lineHeight: 1,
                  position: "relative", zIndex: 1,
                  transition: "color 0.2s, font-weight 0.15s",
                }}>
                  {item.label}
                </span>

                {/* Active dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div key="dot"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 460, damping: 24, delay: 0.04 }}
                      style={{
                        position: "absolute", bottom: -1,
                        width: 3, height: 3, borderRadius: "50%",
                        background: activeC,
                        boxShadow: `0 0 5px ${activeC}`,
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}