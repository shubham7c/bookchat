import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS = [
  {
    id: "home", label: "Home", path: "/home",
    Icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12L12 5L19 12V20C19 20.55 18.55 21 18 21H15V16H9V21H6C5.45 21 5 20.55 5 20V12Z"
          stroke={active ? "#c47a1e" : "#a89478"} strokeWidth={active ? 2.1 : 1.6}
          fill={active ? "rgba(196,122,30,0.13)" : "none"} strokeLinejoin="round"/>
        <path d="M9 21V16H15V21" stroke={active ? "#c47a1e" : "#a89478"} strokeWidth={active ? 2.1 : 1.6} strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "explore", label: "Explore", path: "/explore",
    Icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={active ? "#c47a1e" : "#a89478"} strokeWidth={active ? 2.1 : 1.6}
          fill={active ? "rgba(196,122,30,0.1)" : "none"}/>
        <path d="M16.5 16.5L21 21" stroke={active ? "#c47a1e" : "#a89478"} strokeWidth={active ? 2.1 : 1.6} strokeLinecap="round"/>
        {active && <path d="M8.5 11A2.5 2.5 0 0 1 11 8.5" stroke="#c47a1e" strokeWidth="1.5" strokeLinecap="round"/>}
      </svg>
    ),
  },
  { id: "post", label: "", path: null, Icon: null },
  {
    id: "chat", label: "Chat", path: "/chat",
    Icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
          stroke={active ? "#c47a1e" : "#a89478"} strokeWidth={active ? 2.1 : 1.6}
          fill={active ? "rgba(196,122,30,0.11)" : "none"} strokeLinejoin="round"/>
        {active && <>
          <line x1="8" y1="9" x2="16" y2="9" stroke="#c47a1e" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8" y1="12.5" x2="13" y2="12.5" stroke="#c47a1e" strokeWidth="1.5" strokeLinecap="round"/>
        </>}
      </svg>
    ),
  },
  {
    id: "profile", label: "Me", path: "/profile",
    Icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke={active ? "#c47a1e" : "#a89478"} strokeWidth={active ? 2.1 : 1.6}
          fill={active ? "rgba(196,122,30,0.13)" : "none"}/>
        <path d="M4 20C4 17.3 7.58 15 12 15C16.42 15 20 17.3 20 20"
          stroke={active ? "#c47a1e" : "#a89478"} strokeWidth={active ? 2.1 : 1.6} strokeLinecap="round"/>
      </svg>
    ),
  },
];

const FAB_OPTIONS = [
  { emoji: "📖", label: "Book Spark",    sub: "Share a thought about a book",   color: "#c47a1e", bg: "rgba(196,122,30,0.09)" },
  { emoji: "✒️", label: "Write Excerpt", sub: "Share a piece of your writing",   color: "#6b4fa0", bg: "rgba(107,79,160,0.09)" },
  { emoji: "⭐", label: "Recommend",     sub: "A book you loved",               color: "#2a7a5a", bg: "rgba(42,122,90,0.09)"  },
  { emoji: "👥", label: "Activity",      sub: "What you're reading now",        color: "#3a6a9a", bg: "rgba(58,106,154,0.09)" },
];

export default function BottomNav({ active = "home" }) {
  const navigate = useNavigate();
  const [fab, setFab] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      if (!fab) setHidden(y > lastY.current && y > 90);
      lastY.current = y;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [fab]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {fab && (
          <motion.div
            key="bc"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setFab(false)}
            style={{ position: "fixed", inset: 0, zIndex: 48, background: "rgba(10,7,3,0.58)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          />
        )}
      </AnimatePresence>

      {/* FAB menu */}
      <AnimatePresence>
        {fab && (
          <div style={{ position: "fixed", bottom: 92, left: "50%", transform: "translateX(-50%)", zIndex: 49, width: "min(290px, calc(100vw - 32px))", display: "flex", flexDirection: "column", gap: 8 }}>
            {FAB_OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.label}
                initial={{ opacity: 0, y: 18, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.93 }}
                transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
                whileHover={{ scale: 1.03, x: 4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setFab(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "13px 16px", borderRadius: 18,
                  background: "rgba(255,252,245,0.98)",
                  border: `1px solid ${opt.color}22`,
                  boxShadow: "0 8px 36px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.95)",
                  cursor: "pointer", textAlign: "left", fontFamily: "Gilroy, sans-serif",
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 13, background: opt.bg, border: `1px solid ${opt.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                  {opt.emoji}
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1a1208", letterSpacing: "-0.01em" }}>{opt.label}</div>
                  <div style={{ fontSize: "0.69rem", color: "#9a8870", marginTop: 1 }}>{opt.sub}</div>
                </div>
                <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke={opt.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Bar */}
      <motion.nav
        animate={{ y: hidden && !fab ? 110 : 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, padding: "0 14px 12px", pointerEvents: "none" }}
      >
        {/* Gradient above */}
        <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, height: 44, background: "linear-gradient(to top, rgba(250,246,239,1), transparent)", pointerEvents: "none" }} />

        <div style={{
          pointerEvents: "all",
          background: "rgba(255,252,245,0.97)",
          border: "1px solid rgba(196,122,30,0.14)",
          borderRadius: 28,
          padding: "8px 4px",
          display: "flex", alignItems: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)",
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        }}>
          {ITEMS.map((item) => {
            const isActive = active === item.id;
            const isFab = item.id === "post";

            if (isFab) return (
              <div key="fab" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <motion.button
                  onClick={() => setFab(p => !p)}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: 54, height: 54, borderRadius: 20,
                    background: fab ? "linear-gradient(145deg,#2a1200,#5a2800)" : "linear-gradient(145deg,#b86810,#c47a1e,#e8a840)",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: fab ? "0 2px 8px rgba(0,0,0,0.25)" : "0 6px 24px rgba(196,122,30,0.5), inset 0 1px 0 rgba(255,255,255,0.22)",
                    transition: "background 0.3s, box-shadow 0.3s",
                  }}
                >
                  <motion.div animate={{ rotate: fab ? 45 : 0 }} transition={{ type: "spring", stiffness: 280, damping: 20 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                </motion.button>
              </div>
            );

            const { Icon } = item;
            return (
              <motion.button
                key={item.id}
                onClick={() => item.path && navigate(item.path)}
                whileTap={{ scale: 0.84 }}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "5px 2px", background: "none", border: "none", cursor: "pointer", position: "relative", borderRadius: 16 }}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div key="glow"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      style={{ position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)", width: 38, height: 38, borderRadius: 13, background: "rgba(196,122,30,0.12)", zIndex: 0 }}
                    />
                  )}
                </AnimatePresence>

                <div style={{ position: "relative", zIndex: 1 }}>
                  <Icon active={isActive} />
                </div>

                <span style={{ fontSize: "0.57rem", fontWeight: isActive ? 800 : 500, color: isActive ? "#c47a1e" : "#b8a888", letterSpacing: isActive ? "0.04em" : "0.02em", transition: "all 0.2s", position: "relative", zIndex: 1, fontFamily: "Gilroy, sans-serif" }}>
                  {item.label}
                </span>

                <AnimatePresence>
                  {isActive && (
                    <motion.div key="dot"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      style={{ position: "absolute", bottom: 1, width: 4, height: 4, borderRadius: "50%", background: "#c47a1e" }}
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