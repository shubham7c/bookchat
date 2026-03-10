import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { useAuthStore } from "../store/authStore";
import BottomNav from "../components/shared/BottomNav";
import { Bell, Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, Feather, Star, TrendingUp, ChevronRight, Sparkles, X } from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const FRIENDS = [
  { id: 1, name: "Priya",  emoji: "👩‍🎨", color: "var(--bc-amber)", writing: false },
  { id: 2, name: "Rohan",  emoji: "👨‍🔬", color: "#6b4fa0", writing: true  },
  { id: 3, name: "Aryan",  emoji: "🧑‍💻", color: "#2a7a9a", writing: false },
  { id: 4, name: "Sneha",  emoji: "👩‍💼", color: "#5a8a3a", writing: false },
  { id: 5, name: "Dev",    emoji: "🧑‍🎤", color: "#a04060", writing: false },
  { id: 6, name: "Kavya",  emoji: "👩‍🏫", color: "#3a6a7a", writing: true  },
];

const FEED = [
  {
    id: 1, type: "spark",
    user: { name: "Priya Mehta",    tag: "The Empath",         emoji: "👩‍🎨", role: "reader" },
    time: "2m ago",
    book: { title: "Dune", author: "Frank Herbert", cover: "📗" },
    content: "\"I must not fear. Fear is the mind-killer.\" — Finished Dune for the third time and it hits differently every single read. Herbert was decades ahead of his time.",
    likes: 142, comments: 28, saves: 64, liked: false, saved: false,
    tags: ["#Dune", "#SciFi", "#MustRead"],
  },
  {
    id: 2, type: "excerpt",
    user: { name: "Rohan Kapoor",   tag: "The Craftsperson",   emoji: "👨‍🔬", role: "writer" },
    time: "18m ago",
    excerpt_title: "From: \"The Glass Archive\" — Ch. 3",
    content: "The old library smelled of rain and forgotten promises. She ran her fingers along the spines — each one a door she hadn't opened yet. Some doors are better left closed. But tonight, she needed one to open.",
    likes: 89, comments: 41, saves: 33, liked: true, saved: false,
    tags: ["#Fiction", "#Writing", "#Excerpt"],
  },
  {
    id: 3, type: "activity",
    user: { name: "Aryan Singh",    tag: "The Scholar",        emoji: "🧑‍💻", role: "reader" },
    time: "45m ago",
    book: { title: "Sapiens", author: "Yuval Noah Harari", cover: "📘" },
    content: "Finally picked this up after two years on my shelf. Ten pages in and already questioning everything I thought I knew about human history.",
    likes: 58, comments: 12, saves: 22, liked: false, saved: false,
    tags: ["#Sapiens", "#NonFiction", "#History"],
  },
  {
    id: 4, type: "recommendation",
    user: { name: "Sneha Trivedi",  tag: "The Active Dreamer", emoji: "👩‍💼", role: "both" },
    time: "1h ago",
    book: { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", cover: "📙" },
    content: "If you've wondered why smart people make irrational decisions — this is the answer. Kahneman explains System 1 vs 2 thinking so elegantly. Changed how I see every decision I make.",
    rating: 5,
    likes: 203, comments: 47, saves: 118, liked: false, saved: true,
    tags: ["#NonFiction", "#Psychology", "#MustRead"],
  },
  {
    id: 5, type: "spark",
    user: { name: "Dev Pillai",     tag: "The Thinker",        emoji: "🧑‍🎤", role: "reader" },
    time: "2h ago",
    book: { title: "Atomic Habits", author: "James Clear", cover: "📕" },
    content: "1% better every day sounds trivial. Compounded over a year — you're 37x better. One chapter a day = 12 books a year. The math changes everything.",
    likes: 318, comments: 62, saves: 201, liked: false, saved: false,
    tags: ["#AtomicHabits", "#Mindset", "#Reading"],
  },
  {
    id: 6, type: "excerpt",
    user: { name: "Kavya Rao",      tag: "The Emerging Voice", emoji: "👩‍🏫", role: "writer" },
    time: "3h ago",
    excerpt_title: "From: \"Salt and Silence\" — Opening",
    content: "He kept all his grief in a locked box under the stairs. Every night he could hear it breathing. The neighbors called it a dog. He let them believe that.",
    likes: 167, comments: 55, saves: 89, liked: false, saved: false,
    tags: ["#FlashFiction", "#Writing", "#Excerpt"],
  },
];

const TRENDING = [
  { title: "Dune",                 author: "Frank Herbert", cover: "📗", sparks: 412 },
  { title: "The Midnight Library", author: "Matt Haig",     cover: "📕", sparks: 387 },
  { title: "Atomic Habits",        author: "James Clear",   cover: "📙", sparks: 356 },
];

const NOTIFS = [
  { icon: "❤️", text: "Priya liked your Book Spark",      time: "2m",  unread: true  },
  { icon: "💬", text: "Rohan commented on your excerpt",  time: "18m", unread: true  },
  { icon: "👤", text: "Dev started following you",        time: "1h",  unread: false },
  { icon: "📚", text: "New reco based on your shelf",     time: "2h",  unread: false },
];

// ─── HEADER ───────────────────────────────────────────────────────────────────

function Header({ user }) {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const bg     = useTransform(scrollY, [0, 55], ["var(--bc-bg)00",    "var(--bc-blur)"   ]);
  const border = useTransform(scrollY, [0, 55], ["rgba(196,122,30,0)",     "rgba(196,122,30,0.12)"    ]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 45,
        height: 60, padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: bg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid", borderColor: border,
      }}>
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <motion.div whileHover={{ rotate: [-8, 8, 0] }} transition={{ duration: 0.4 }}
            style={{ width: 38, height: 38, borderRadius: 13, background: "linear-gradient(145deg,#fff8ee,#eeddb8)", border: "1px solid rgba(196,122,30,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(196,122,30,0.2), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#c47a1e" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#c47a1e" strokeWidth="1.8"/>
              <line x1="9" y1="7" x2="15" y2="7" stroke="#e8a94a" strokeWidth="1.3" strokeLinecap="round" opacity="0.85"/>
              <line x1="9" y1="10.5" x2="13" y2="10.5" stroke="#e8a94a" strokeWidth="1.3" strokeLinecap="round" opacity="0.55"/>
            </svg>
          </motion.div>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--bc-text-primary)", letterSpacing: "-0.025em", lineHeight: 1.1, fontFamily: "Gilroy, sans-serif" }}>BookChat</div>
            <div style={{ fontSize: "0.5rem", color: "var(--bc-amber)", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "Gilroy, sans-serif" }}>✦ For Readers</div>
          </div>
        </motion.div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.91 }}
            onClick={() => setOpen(p => !p)}
            style={{ width: 38, height: 38, borderRadius: 13, background: open ? "rgba(196,122,30,0.14)" : "rgba(196,122,30,0.07)", border: "1px solid var(--bc-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
            <Bell size={17} color={open ? "#c47a1e" : "#7a6040"} strokeWidth={1.8}/>
            <AnimatePresence>
              {!open && (
                <motion.span key="dot" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#d44020", border: "1.5px solid #faf6ef" }}/>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
            onClick={() => navigate("/profile")}
            style={{ width: 38, height: 38, borderRadius: 13, background: "linear-gradient(145deg,#f0ddb0,#dfc870)", border: "1.5px solid rgba(196,122,30,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", fontSize: "0.95rem", fontWeight: 800, color: "var(--bc-text-amber)", fontFamily: "Gilroy, sans-serif", boxShadow: "0 2px 10px rgba(196,122,30,0.2)" }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              : (user?.displayName?.[0]?.toUpperCase() || "📖")
            }
          </motion.button>
        </div>
      </motion.header>

      {/* Notif panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="nbg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 44 }}/>
            <motion.div key="npanel"
              initial={{ opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "fixed", top: 66, right: 14, width: "min(306px, calc(100vw - 28px))", background: "var(--bc-bg-card)", border: "1px solid var(--bc-border)", borderRadius: 20, zIndex: 46, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.13)" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(196,122,30,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--bc-text-primary)", fontFamily: "Gilroy, sans-serif" }}>Notifications</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: "0.62rem", color: "var(--bc-amber)", fontWeight: 700, cursor: "pointer", fontFamily: "Gilroy, sans-serif" }}>Mark all read</span>
                  <motion.button whileHover={{ scale: 1.15 }} onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bc-text-faint)", display: "flex", padding: 2 }}>
                    <X size={13}/>
                  </motion.button>
                </div>
              </div>
              {NOTIFS.map((n, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  whileHover={{ background: "rgba(196,122,30,0.04)" }}
                  style={{ display: "flex", gap: 11, padding: "11px 16px", borderBottom: i < NOTIFS.length - 1 ? "1px solid rgba(196,122,30,0.05)" : "none", cursor: "pointer", transition: "background 0.15s", background: n.unread ? "rgba(196,122,30,0.028)" : "transparent" }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.76rem", color: "var(--bc-text-secondary)", lineHeight: 1.45, fontWeight: n.unread ? 600 : 400, fontFamily: "Gilroy, sans-serif" }}>{n.text}</p>
                    <p style={{ fontSize: "0.64rem", color: "var(--bc-text-faint)", marginTop: 2, fontFamily: "Gilroy, sans-serif" }}>{n.time} ago</p>
                  </div>
                  {n.unread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c47a1e", flexShrink: 0, marginTop: 5 }}/>}
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── FRIEND STRIP ─────────────────────────────────────────────────────────────

function FriendStrip() {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {FRIENDS.map((f, i) => (
          <motion.div key={f.id}
            initial={{ opacity: 0, scale: 0.78 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 240, damping: 18 }}
            whileHover={{ scale: 1.07, y: -3 }} whileTap={{ scale: 0.93 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", flexShrink: 0, width: 60 }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -2.5, borderRadius: 19, background: `linear-gradient(145deg,${f.color},${f.color}50)` }}/>
              <div style={{ position: "relative", zIndex: 1, width: 54, height: 54, borderRadius: 17, background: `linear-gradient(145deg,${f.color}22,${f.color}0a)`, margin: 2.5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.55rem" }}>
                {f.emoji}
              </div>
              <div style={{ position: "absolute", bottom: -2, right: -2, zIndex: 2, width: 17, height: 17, borderRadius: 6, background: "#fffaef", border: "1.5px solid rgba(196,122,30,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem" }}>
                {f.writing ? "✒️" : "📖"}
              </div>
            </div>
            <span style={{ fontSize: "0.59rem", color: "var(--bc-text-muted)", fontWeight: 700, fontFamily: "Gilroy, sans-serif" }}>{f.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── TRENDING ─────────────────────────────────────────────────────────────────

function TrendingRow() {
  return (
    <div style={{ background: "linear-gradient(135deg,rgba(196,122,30,0.07),rgba(196,122,30,0.02))", border: "1px solid var(--bc-border)", borderRadius: 20, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <TrendingUp size={13} color="#c47a1e" strokeWidth={2.2}/>
        <span style={{ fontSize: "0.67rem", fontWeight: 800, color: "var(--bc-text-amber)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Gilroy, sans-serif" }}>Trending Today</span>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
        {TRENDING.map((b, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.08 }}
            whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}
            style={{ flexShrink: 0, width: 118, padding: 12, background: "var(--bc-bg-card)", border: "1px solid rgba(196,122,30,0.11)", borderRadius: 14, cursor: "pointer", boxShadow: "var(--bc-shadow-card)" }}>
            <div style={{ fontSize: "1.9rem", textAlign: "center", marginBottom: 7 }}>{b.cover}</div>
            <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--bc-text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "Gilroy, sans-serif" }}>{b.title}</div>
            <div style={{ fontSize: "0.63rem", color: "var(--bc-text-muted)", marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "Gilroy, sans-serif" }}>{b.author}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {i === 0 && <span style={{ fontSize: "0.7rem" }}>🔥</span>}
              <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "var(--bc-amber)", fontFamily: "Gilroy, sans-serif" }}>{b.sparks}</span>
              <span style={{ fontSize: "0.6rem", color: "var(--bc-text-faint)", fontFamily: "Gilroy, sans-serif" }}>sparks</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── FEED CARD ────────────────────────────────────────────────────────────────

function FeedCard({ post, idx }) {
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [likes, setLikes] = useState(post.likes);
  const [pop,   setPop  ] = useState(false);

  const ROLE = {
    reader: { label: "Reader",          color: "#7a5200", bg: "rgba(196,122,30,0.1)"  },
    writer: { label: "Writer",          color: "#5a3a90", bg: "rgba(107,79,160,0.1)" },
    both:   { label: "Reader & Writer", color: "#2a5a30", bg: "rgba(80,140,60,0.1)"  },
  };
  const TYPE = {
    spark:          { icon: "✦",  label: "Book Spark",     accent: "#c47a1e" },
    excerpt:        { icon: "✒️", label: "Excerpt",        accent: "#6b4fa0" },
    recommendation: { icon: "⭐", label: "Recommendation", accent: "#2a7a5a" },
    activity:       { icon: "📖", label: "Activity",       accent: "#3a6a9a" },
  };
  const rs = ROLE[post.user.role] || ROLE.reader;
  const tc = TYPE[post.type]      || TYPE.spark;

  const onLike = () => {
    setLiked(p => !p);
    setLikes(p => liked ? p - 1 : p + 1);
    if (!liked) { setPop(true); setTimeout(() => setPop(false), 500); }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: "var(--bc-bg-card)", border: "1px solid var(--bc-border-card)", borderRadius: 22, marginBottom: 12, overflow: "hidden", boxShadow: "var(--bc-shadow-card)" }}>

      <div style={{ height: 2, background: `linear-gradient(90deg,transparent 5%,${tc.accent}55 40%,${tc.accent}55 60%,transparent 95%)` }}/>

      <div style={{ padding: "14px 14px 0" }}>
        {/* User */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, background: rs.bg, border: `1px solid ${rs.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
            {post.user.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.87rem", fontWeight: 700, color: "var(--bc-text-primary)", fontFamily: "Gilroy, sans-serif" }}>{post.user.name}</span>
              <span style={{ fontSize: "0.54rem", fontWeight: 700, color: rs.color, background: rs.bg, padding: "2px 7px", borderRadius: 50, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${rs.color}18`, fontFamily: "Gilroy, sans-serif" }}>{rs.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
              <span style={{ fontSize: "0.61rem", color: tc.accent, fontWeight: 700, background: `${tc.accent}12`, padding: "1px 7px", borderRadius: 50, border: `1px solid ${tc.accent}20`, fontFamily: "Gilroy, sans-serif", display: "flex", alignItems: "center", gap: 3 }}>
                <span>{tc.icon}</span>{tc.label}
              </span>
              <span style={{ color: "rgba(196,122,30,0.3)", fontSize: "0.6rem" }}>·</span>
              <span style={{ fontSize: "0.67rem", color: "var(--bc-text-faint)", fontFamily: "Gilroy, sans-serif" }}>{post.time}</span>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bc-text-faint)", padding: 4, display: "flex", flexShrink: 0 }}>
            <MoreHorizontal size={16}/>
          </motion.button>
        </div>

        {/* Book pill */}
        {post.book && (
          <motion.div whileHover={{ scale: 1.01 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 11, marginBottom: 10, background: "linear-gradient(135deg,rgba(196,122,30,0.09),rgba(196,122,30,0.04))", border: "1px solid var(--bc-border)", cursor: "pointer" }}>
            <span style={{ fontSize: "1.1rem" }}>{post.book.cover}</span>
            <div>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--bc-text-amber)", fontFamily: "Gilroy, sans-serif" }}>{post.book.title}</div>
              <div style={{ fontSize: "0.63rem", color: "#a08050", fontFamily: "Gilroy, sans-serif" }}>{post.book.author}</div>
            </div>
            <ChevronRight size={12} color="rgba(196,122,30,0.45)"/>
          </motion.div>
        )}

        {/* Excerpt label */}
        {post.type === "excerpt" && post.excerpt_title && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, fontSize: "0.6rem", fontWeight: 700, color: "#6b4fa0", letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "Gilroy, sans-serif" }}>
            <Feather size={9} strokeWidth={2}/>{post.excerpt_title}
          </div>
        )}

        {/* Content */}
        <p style={{ fontSize: post.type === "excerpt" ? "0.92rem" : "0.85rem", color: "var(--bc-text-secondary)", lineHeight: post.type === "excerpt" ? 1.78 : 1.63, fontStyle: post.type === "excerpt" ? "italic" : "normal", marginBottom: 10, fontFamily: "Gilroy, sans-serif" }}>
          {post.content}
        </p>

        {/* Stars */}
        {post.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 8 }}>
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={13} fill={n <= post.rating ? "#c47a1e" : "none"} color={n <= post.rating ? "#c47a1e" : "rgba(196,122,30,0.25)"} strokeWidth={1.5}/>
            ))}
            <span style={{ fontSize: "0.7rem", color: "#8a7060", marginLeft: 4, fontWeight: 700, fontFamily: "Gilroy, sans-serif" }}>{post.rating}.0</span>
          </div>
        )}

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {post.tags.map(t => (
            <motion.span key={t} whileHover={{ color: "var(--bc-text-amber)" }} style={{ fontSize: "0.67rem", color: "#9a7830", fontWeight: 600, cursor: "pointer", transition: "color 0.15s", fontFamily: "Gilroy, sans-serif" }}>{t}</motion.span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "9px 13px 12px", borderTop: "1px solid rgba(196,122,30,0.07)", display: "flex", alignItems: "center", gap: 2 }}>
        <motion.button onClick={onLike} whileTap={{ scale: 0.8 }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 10, background: liked ? "rgba(210,55,55,0.07)" : "transparent", border: "none", cursor: "pointer", transition: "background 0.2s" }}>
          <motion.div animate={{ scale: pop ? [1, 1.7, 0.85, 1] : 1 }} transition={{ duration: 0.32 }}>
            <Heart size={17} strokeWidth={1.8} fill={liked ? "#d03535" : "none"} color={liked ? "#d03535" : "#9a8870"}/>
          </motion.div>
          <span style={{ fontSize: "0.73rem", fontWeight: 600, color: liked ? "#d03535" : "#9a8870", fontFamily: "Gilroy, sans-serif" }}>{likes}</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.88 }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 10, background: "transparent", border: "none", cursor: "pointer" }}>
          <MessageSquare size={17} strokeWidth={1.8} color="#9a8870"/>
          <span style={{ fontSize: "0.73rem", fontWeight: 600, color: "var(--bc-text-muted)", fontFamily: "Gilroy, sans-serif" }}>{post.comments}</span>
        </motion.button>

        <div style={{ flex: 1 }}/>

        <motion.button onClick={() => setSaved(p => !p)} whileTap={{ scale: 0.84 }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 10, background: saved ? "rgba(196,122,30,0.09)" : "transparent", border: "none", cursor: "pointer", transition: "background 0.2s" }}>
          <motion.div animate={{ scale: saved ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.22 }}>
            <Bookmark size={17} strokeWidth={1.8} fill={saved ? "#c47a1e" : "none"} color={saved ? "#c47a1e" : "#9a8870"}/>
          </motion.div>
          <span style={{ fontSize: "0.73rem", fontWeight: 600, color: saved ? "#c47a1e" : "#9a8870", fontFamily: "Gilroy, sans-serif" }}>
            {post.saves + (saved && !post.saved ? 1 : !saved && post.saved ? -1 : 0)}
          </span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.88 }}
          style={{ display: "flex", padding: "7px 8px", borderRadius: 10, background: "transparent", border: "none", cursor: "pointer" }}>
          <Share2 size={16} strokeWidth={1.8} color="#9a8870"/>
        </motion.button>
      </div>
    </motion.article>
  );
}

// ─── GREETING ─────────────────────────────────────────────────────────────────

function Greeting({ user }) {
  const h = new Date().getHours();
  const [label, emoji] = h < 12 ? ["Good morning","☀️"] : h < 17 ? ["Good afternoon","🌤️"] : ["Good evening","🌙"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: "16px 18px", marginBottom: 16, background: "linear-gradient(135deg,rgba(196,122,30,0.1),rgba(196,122,30,0.03))", border: "1px solid rgba(196,122,30,0.15)", borderRadius: 18, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: "12%", right: "12%", height: 1, background: "linear-gradient(90deg,transparent,rgba(196,122,30,0.32),transparent)" }}/>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "0.67rem", color: "var(--bc-text-faint)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3, fontFamily: "Gilroy, sans-serif" }}>{emoji} {label}</p>
          <h1 style={{ fontSize: "clamp(1rem,4vw,1.15rem)", fontWeight: 800, color: "var(--bc-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.1, fontFamily: "Gilroy, sans-serif" }}>
            {user?.displayName?.split(" ")[0] || "Reader"}
          </h1>
          {user?.personalityTag && (
            <p style={{ fontSize: "0.69rem", color: "var(--bc-amber)", fontWeight: 700, marginTop: 3, fontFamily: "Gilroy, sans-serif" }}>✦ {user.personalityTag}</p>
          )}
        </div>
        <motion.span animate={{ rotate: [0,6,-6,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ fontSize: "2.4rem", opacity: 0.75 }}>📚</motion.span>
      </div>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuthStore();
  const pageRef  = useRef(null);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
    }
  }, []);

  return (
    <div ref={pageRef} style={{ minHeight: "100dvh", background: "var(--bc-bg)", fontFamily: "Gilroy, sans-serif" }}>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-15%", right: "-15%", width: "55vw", height: "55vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(196,122,30,0.055) 0%,transparent 65%)" }}/>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(196,122,30,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(196,122,30,0.022) 1px,transparent 1px)", backgroundSize: "48px 48px" }}/>
      </div>

      <Header user={user}/>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "72px 14px 100px" }}>
        <Greeting user={user}/>
        <FriendStrip/>
        <TrendingRow/>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} color="#c47a1e" strokeWidth={2.2}/>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--bc-text-primary)", letterSpacing: "0.02em", fontFamily: "Gilroy, sans-serif" }}>Your Feed</span>
          </div>
          <motion.button whileHover={{ color: "var(--bc-amber)" }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--bc-text-faint)", fontSize: "0.68rem", fontFamily: "Gilroy, sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, transition: "color 0.2s" }}>
            Filter <ChevronRight size={11}/>
          </motion.button>
        </div>

        {FEED.map((post, i) => <FeedCard key={post.id} post={post} idx={i}/>)}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{ textAlign: "center", padding: "20px 0 6px", color: "var(--bc-text-faint)", fontSize: "0.67rem", fontWeight: 600, letterSpacing: "0.14em", fontFamily: "Gilroy, sans-serif" }}>
          ✦ &nbsp; You're all caught up &nbsp; ✦
        </motion.p>
      </main>

      <BottomNav active="home"/>

      <style>{`
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
        ::-webkit-scrollbar{display:none;}
        html,body{scroll-behavior:smooth;margin:0;padding:0;}
      `}</style>
    </div>
  );
}