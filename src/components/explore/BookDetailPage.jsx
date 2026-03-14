// src/components/explore/BookDetailPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Heart, Star, ExternalLink } from 'lucide-react';
import { Skeleton } from './ExploreUI';
import { useThemeStore } from '../../store/themeStore';
import { coverUrl } from '../../api/openLibrary';

const MOCK_READERS = [
  { name: 'Priya', initial: 'P', color: '#7c4dcc' },
  { name: 'Rohan', initial: 'R', color: '#2196b0' },
  { name: 'Sneha', initial: 'S', color: '#c0394a' },
  { name: 'Aryan', initial: 'A', color: '#2e7d52' },
  { name: 'Maya',  initial: 'M', color: '#b05a1a' },
];

export default function BookDetailPage({ book, onBack }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [bgLoaded,     setBgLoaded]     = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [reading,      setReading]      = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const coverId  = book.cover_i ?? book.cover_id ?? book.covers?.[0];
  const title    = book.title ?? 'Unknown Title';
  const authors  = book.author_name ?? (book.authors?.map(a => a.name)) ?? [];
  const authorStr = Array.isArray(authors) ? authors.slice(0,2).join(', ') : authors;
  const year     = book.first_publish_year ?? book.first_published ?? '';
  const desc     = book.description?.value ?? book.description ?? book.first_sentence?.value ?? '';
  const descText = typeof desc === 'string' ? desc.replace(/\n+/g, ' ').trim() : '';
  const subjects = (book.subject ?? book.subjects ?? []).slice(0, 8);
  const rating   = book.ratings_average ? Math.round(book.ratings_average * 10) / 10 : null;

  const pageBg  = isDark ? '#0f0d09' : '#faf6ef';
  const cardBg  = isDark ? '#171208' : '#fffdf6';
  const textP   = isDark ? '#f0e8d8' : '#1a1208';
  const textM   = isDark ? '#7a6a52' : '#9a8a72';
  const textF   = isDark ? '#4a3e2a' : '#c0b0a0';
  const amber   = isDark ? '#e8a840' : '#c47a1e';
  const border  = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: pageBg,
        overflowY: 'auto', scrollbarWidth: 'none' }}>

      {/* ── HERO SECTION ── */}
      <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
        {/* Blurred cover BG */}
        {coverId && (
          <img src={coverUrl(coverId, 'L')} alt=""
            onLoad={() => setBgLoaded(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', filter: 'blur(30px) saturate(0.7) brightness(0.45)',
              transform: 'scale(1.2)', transition: 'opacity 0.7s ease',
              opacity: bgLoaded ? 1 : 0 }}/>
        )}
        {/* Dark overlay gradient */}
        <div style={{ position: 'absolute', inset: 0,
          background: isDark
            ? 'linear-gradient(180deg, rgba(15,13,9,0.2) 0%, rgba(15,13,9,0.5) 60%, #0f0d09 100%)'
            : 'linear-gradient(180deg, rgba(250,246,239,0.1) 0%, rgba(250,246,239,0.6) 60%, #faf6ef 100%)' }}/>

        {/* Back button */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ position: 'absolute', top: 52, left: 18, zIndex: 10,
            width: 42, height: 42, borderRadius: 14,
            background: isDark ? 'rgba(15,13,9,0.72)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
          <ArrowLeft size={18} color={textP}/>
        </motion.button>

        {/* Save button */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setSaved(p => !p)}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
          style={{ position: 'absolute', top: 52, right: 18, zIndex: 10,
            width: 42, height: 42, borderRadius: 14,
            background: isDark ? 'rgba(15,13,9,0.72)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${saved ? amber+'60' : border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
          <Heart size={17} color={saved ? amber : textM} fill={saved ? amber : 'none'}/>
        </motion.button>

        {/* Cover art — floating centered */}
        <div style={{ position: 'absolute', bottom: -56, left: '50%',
          transform: 'translateX(-50%)', zIndex: 5 }}>
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}>
            {/* Glow */}
            <div style={{ position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
              width: 90, height: 24, borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(196,122,30,0.55) 0%, transparent 70%)`,
              filter: 'blur(8px)' }}/>
            <div style={{ width: 118, height: 176, borderRadius: 16, overflow: 'hidden',
              background: isDark ? '#1c1408' : '#f0e4c8',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(196,122,30,0.15)' }}>
              {coverId ? (
                <img src={coverUrl(coverId, 'M')} alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: 12, flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: '2rem', opacity: 0.3 }}>📚</span>
                  <span style={{ fontSize: '0.6rem', color: textF, textAlign: 'center',
                    fontFamily: 'Gilroy, sans-serif', lineHeight: 1.4 }}>{title}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '72px 20px 100px' }}>

        {/* Title + Meta */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }} style={{ textAlign: 'center', marginBottom: 22 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: textP,
            fontFamily: 'Gilroy, sans-serif', letterSpacing: '-0.03em',
            lineHeight: 1.22, margin: '0 0 10px' }}>{title}</h1>
          {authorStr && (
            <div style={{ fontSize: '0.85rem', color: amber, fontWeight: 700,
              fontFamily: 'Gilroy, sans-serif', marginBottom: 10 }}>{authorStr}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            {year && (
              <span style={{ fontSize: '0.72rem', color: textF,
                fontFamily: 'Gilroy, sans-serif' }}>{year}</span>
            )}
            {rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5,
                background: isDark ? 'rgba(196,122,30,0.12)' : 'rgba(196,122,30,0.09)',
                border: `1px solid ${border}`, borderRadius: 50, padding: '4px 10px' }}>
                <Star size={11} color={amber} fill={amber}/>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: amber,
                  fontFamily: 'Gilroy, sans-serif' }}>{rating}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setReading(p => !p)}
            style={{ flex: 1, padding: '14px 0', borderRadius: 16, border: 'none',
              cursor: 'pointer', fontFamily: 'Gilroy, sans-serif', fontSize: '0.88rem',
              fontWeight: 700, color: '#fff',
              background: reading
                ? `linear-gradient(135deg,#5a3800,#a07020)`
                : `linear-gradient(135deg,#8a5000,${amber})`,
              boxShadow: reading ? 'none' : '0 6px 24px rgba(196,122,30,0.45)',
              transition: 'all 0.25s' }}>
            {reading ? '✓ Reading' : '📖 Start Reading'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSaved(p => !p)}
            style={{ width: 54, borderRadius: 16, cursor: 'pointer', flexShrink: 0,
              background: saved ? `rgba(196,122,30,0.15)` : cardBg,
              border: `1.5px solid ${saved ? amber+'50' : border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s' }}>
            <Heart size={18} color={saved ? amber : textM} fill={saved ? amber : 'none'}/>
          </motion.button>
        </motion.div>

        {/* Users currently reading */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          style={{ background: cardBg, border: `1px solid ${border}`,
            borderRadius: 18, padding: '14px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.05)' }}>
          {/* Overlapping reader bubbles */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {MOCK_READERS.slice(0, 4).map((r, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: '50%',
                background: r.color + '28', border: `2.5px solid ${r.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i, position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: r.color,
                  fontFamily: 'Gilroy, sans-serif' }}>{r.initial}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textP,
              fontFamily: 'Gilroy, sans-serif' }}>
              {MOCK_READERS.length} readers on BookChat
            </div>
            <div style={{ fontSize: '0.65rem', color: textF,
              fontFamily: 'Gilroy, sans-serif', marginTop: 2 }}>
              are currently reading this
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', color: textF, flexShrink: 0 }}>›</div>
        </motion.div>

        {/* About / Description */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: textF,
            letterSpacing: '0.13em', textTransform: 'uppercase',
            fontFamily: 'Gilroy, sans-serif', marginBottom: 12 }}>About this book</div>
          {descText ? (
            <p style={{ fontSize: '0.86rem', color: textM, lineHeight: 1.78,
              fontFamily: 'Gilroy, sans-serif', margin: 0 }}>
              {descExpanded ? descText : descText.slice(0, 300)}
              {descText.length > 300 && (
                <span onClick={() => setDescExpanded(p => !p)}
                  style={{ color: amber, fontWeight: 700, cursor: 'pointer', marginLeft: 4 }}>
                  {descExpanded ? ' Show less' : '… Read more'}
                </span>
              )}
            </p>
          ) : (
            <div style={{ padding: '16px 20px', borderRadius: 14, textAlign: 'center',
              background: isDark ? 'rgba(196,122,30,0.05)' : 'rgba(196,122,30,0.04)',
              border: `1px solid ${border}` }}>
              <span style={{ fontSize: '0.82rem', color: textF, fontStyle: 'italic',
                fontFamily: 'Gilroy, sans-serif' }}>No description available.</span>
            </div>
          )}
        </motion.div>

        {/* Genres & Tags */}
        {subjects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: textF,
              letterSpacing: '0.13em', textTransform: 'uppercase',
              fontFamily: 'Gilroy, sans-serif', marginBottom: 12 }}>Genres & Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {subjects.map((s, i) => (
                <span key={i} style={{ padding: '6px 14px', borderRadius: 50,
                  fontSize: '0.72rem', fontFamily: 'Gilroy, sans-serif', fontWeight: 600,
                  background: isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.07)',
                  border: `1px solid ${border}`, color: amber }}>
                  {typeof s === 'string' ? s : s.name ?? s}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Open Library link */}
        {book.key && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}>
            <a href={`https://openlibrary.org${book.key}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 18px', borderRadius: 16, textDecoration: 'none',
                background: cardBg, border: `1px solid ${border}`,
                boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.04)' }}>
              <ExternalLink size={15} color={amber}/>
              <span style={{ fontSize: '0.84rem', color: amber, fontWeight: 700,
                fontFamily: 'Gilroy, sans-serif' }}>View on Open Library</span>
            </a>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}