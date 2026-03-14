// src/components/explore/ExploreUI.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { coverUrl, authorImg } from '../../api/openLibrary';
import { Star } from 'lucide-react';

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export function Skeleton({ w, h, r = 10, isDark, style = {} }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: w, height: h, borderRadius: r, flexShrink: 0,
        background: isDark
          ? 'linear-gradient(135deg, rgba(196,122,30,0.07), rgba(196,122,30,0.04))'
          : 'linear-gradient(135deg, rgba(196,122,30,0.09), rgba(196,122,30,0.05))',
        ...style,
      }}
    />
  );
}

// ─── BOOK CARD — tall rectangle, premium feel ─────────────────────────────────
export function BookCard({ book, onTap, isDark, width = 120 }) {
  const [phase, setPhase] = useState('loading');
  const coverId = book.cover_i ?? book.cover_id ?? book.covers?.[0];
  const title   = book.title ?? '';
  const author  = book.author_name?.[0] ?? book.authors?.[0]?.name ?? '';
  const rating  = book.ratings_average ? Math.round(book.ratings_average * 10) / 10 : null;
  const height  = Math.round(width * 1.52);

  const textP  = isDark ? '#f0e8d8' : '#1a1208';
  const textM  = isDark ? '#7a6a52' : '#9a8a72';
  const amber  = isDark ? '#e8a840' : '#c47a1e';
  const cardBg = isDark ? '#181208' : '#fffdf6';
  const border = isDark ? 'rgba(196,122,30,0.12)' : 'rgba(196,122,30,0.1)';

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={() => onTap?.(book)}
      style={{ flexShrink: 0, width, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 9 }}>

      {/* Cover */}
      <div style={{ width, height, borderRadius: 14, overflow: 'hidden', flexShrink: 0, position: 'relative',
        background: isDark ? '#161008' : '#f0e4c8',
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(196,122,30,0.08)'
          : '0 8px 28px rgba(0,0,0,0.14), 0 2px 8px rgba(196,122,30,0.1)',
      }}>
        {phase === 'loading' && <Skeleton w={width} h={height} r={0} isDark={isDark} style={{ position: 'absolute', inset: 0 }}/>}
        {coverId ? (
          <img src={coverUrl(coverId, 'M')} alt={title} loading="lazy"
            onLoad={() => setPhase('loaded')} onError={() => setPhase('error')}
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              opacity: phase === 'loaded' ? 1 : 0, transition: 'opacity 0.4s ease' }}/>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 10, flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '1.4rem', opacity: 0.3 }}>📚</div>
            <span style={{ fontSize: '0.58rem', color: isDark ? '#5a4830' : '#b0987a',
              textAlign: 'center', fontFamily: 'Gilroy, sans-serif', lineHeight: 1.4, fontWeight: 600 }}>
              {title.slice(0, 40)}
            </span>
          </div>
        )}
        {/* Subtle gradient overlay at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.25))', pointerEvents: 'none' }}/>
      </div>

      {/* Info */}
      <div style={{ paddingLeft: 2 }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: textP,
          fontFamily: 'Gilroy, sans-serif', lineHeight: 1.35,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 3 }}>
          {title}
        </div>
        {author && (
          <div style={{ fontSize: '0.62rem', color: textM,
            fontFamily: 'Gilroy, sans-serif', lineHeight: 1.2,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {author}
          </div>
        )}
        {rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
            <Star size={9} color={amber} fill={amber}/>
            <span style={{ fontSize: '0.6rem', color: amber, fontWeight: 700,
              fontFamily: 'Gilroy, sans-serif' }}>{rating}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── AUTHOR CARD — horizontal rectangle, NOT circle ──────────────────────────
export function AuthorCard({ author, onTap, isDark, compact = false }) {
  const [imgPhase, setImgPhase] = useState('loading');
  const textP  = isDark ? '#f0e8d8' : '#1a1208';
  const textM  = isDark ? '#7a6a52' : '#9a8a72';
  const amber  = isDark ? '#e8a840' : '#c47a1e';
  const cardBg = isDark ? '#171208' : '#fffdf6';
  const border = isDark ? 'rgba(196,122,30,0.11)' : 'rgba(196,122,30,0.09)';
  const initials = author.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (compact) {
    // Compact: for horizontal scroll row on main explore
    return (
      <motion.div
        whileTap={{ scale: 0.96 }}
        onClick={() => onTap?.(author)}
        style={{ flexShrink: 0, width: 156, borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
          background: cardBg, border: `1px solid ${border}`,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.07)' }}>

        {/* Top image area */}
        <div style={{ width: '100%', height: 88, position: 'relative',
          background: isDark ? '#1c1408' : '#f5ead5', overflow: 'hidden' }}>
          {/* blurred bg */}
          <img src={`https://covers.openlibrary.org/a/olid/${author.key}-M.jpg`} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', filter: 'blur(14px) saturate(0.5)', transform: 'scale(1.2)',
              opacity: imgPhase === 'loaded' ? 0.35 : 0, transition: 'opacity 0.4s' }}/>
          {/* Centered avatar */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, overflow: 'hidden', position: 'relative',
              background: isDark ? '#2a1e0c' : '#ede0b8',
              border: `2px solid rgba(196,122,30,0.3)`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800,
                color: isDark ? '#e8a840' : '#8b6914', fontFamily: 'Gilroy, sans-serif' }}>{initials}</span>
              <img src={`https://covers.openlibrary.org/a/olid/${author.key}-S.jpg`} alt={author.name}
                onLoad={() => setImgPhase('loaded')} onError={() => setImgPhase('error')}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', opacity: imgPhase === 'loaded' ? 1 : 0, transition: 'opacity 0.3s' }}/>
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: textP,
            fontFamily: 'Gilroy, sans-serif', lineHeight: 1.25, marginBottom: 3,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
            {author.name}
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: amber,
            fontFamily: 'Gilroy, sans-serif' }}>
            {author.type || author.genre || 'Author'}
          </div>
        </div>
      </motion.div>
    );
  }

  // List item (for AllAuthorsPage)
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={() => onTap?.(author)}
      style={{ display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 18, cursor: 'pointer',
        background: cardBg, border: `1px solid ${border}`,
        boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)',
        transition: 'transform 0.15s' }}>

      {/* Rounded rect avatar */}
      <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
        position: 'relative', background: isDark ? '#2a1e0c' : '#ede0b8',
        border: `1.5px solid rgba(196,122,30,0.2)`,
        boxShadow: isDark ? '0 3px 14px rgba(0,0,0,0.5)' : '0 3px 14px rgba(196,122,30,0.12)' }}>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800,
          color: isDark ? '#e8a840' : '#8b6914', fontFamily: 'Gilroy, sans-serif', zIndex: 1 }}>{initials}</span>
        <img src={`https://covers.openlibrary.org/a/olid/${author.key}-S.jpg`} alt={author.name}
          onError={() => {}} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 2 }}/>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: textP,
          fontFamily: 'Gilroy, sans-serif', marginBottom: 3,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{author.name}</div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: amber,
          fontFamily: 'Gilroy, sans-serif' }}>
          {author.type || author.top_subjects?.[0] || 'Author'}
        </div>
        {author.work_count && (
          <div style={{ fontSize: '0.6rem', color: textM,
            fontFamily: 'Gilroy, sans-serif', marginTop: 2 }}>
            {author.work_count.toLocaleString()} works
          </div>
        )}
      </div>

      <div style={{ fontSize: '1.1rem', color: isDark ? '#3a3020' : '#d0c0a0', flexShrink: 0 }}>›</div>
    </motion.div>
  );
}

// ─── AUTHOR AVATAR (square rounded rect, for detail pages) ───────────────────
export function AuthorAvatar({ olKey, name, size = 56, isDark, style = {} }) {
  const [phase, setPhase] = useState('idle');
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28),
      overflow: 'hidden', flexShrink: 0, position: 'relative',
      background: isDark ? '#2a1e0c' : '#ede0b8',
      border: '2px solid rgba(196,122,30,0.25)',
      boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.55)' : '0 4px 18px rgba(196,122,30,0.15)',
      ...style }}>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: size * 0.3, fontWeight: 800,
        color: isDark ? '#e8a840' : '#8b6914', fontFamily: 'Gilroy, sans-serif', zIndex: 1,
        userSelect: 'none' }}>{initials}</span>
      {olKey && (
        <img src={`https://covers.openlibrary.org/a/olid/${olKey}-M.jpg`} alt={name}
          onLoad={() => setPhase('loaded')} onError={() => setPhase('error')}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 2,
            opacity: phase === 'loaded' ? 1 : 0, transition: 'opacity 0.35s' }}/>
      )}
    </div>
  );
}

// ─── BOOK COVER (simple, used in detail pages) ────────────────────────────────
export function BookCover({ coverId, title, size = 90, isDark, style = {} }) {
  const [phase, setPhase] = useState('loading');
  const h = Math.round(size * 1.5);
  return (
    <div style={{ width: size, height: h, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
      background: isDark ? '#161008' : '#f0e4c8', position: 'relative',
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.65)' : '0 8px 28px rgba(0,0,0,0.14)',
      ...style }}>
      {phase === 'loading' && <Skeleton w={size} h={h} r={0} isDark={isDark} style={{ position: 'absolute', inset: 0 }}/>}
      {coverId ? (
        <img src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`} alt={title}
          onLoad={() => setPhase('loaded')} onError={() => setPhase('error')}
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            opacity: phase === 'loaded' ? 1 : 0, transition: 'opacity 0.4s' }}/>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 8 }}>
          <span style={{ fontSize: '0.58rem', color: isDark ? '#5a4830' : '#b0987a',
            textAlign: 'center', fontFamily: 'Gilroy, sans-serif', lineHeight: 1.3 }}>{title}</span>
        </div>
      )}
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
export function SectionHeader({ label, icon, onViewAll, isDark }) {
  const amber = isDark ? '#e8a840' : '#c47a1e';
  const textF = isDark ? '#4a4030' : '#c0b0a0';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: textF,
          letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif' }}>
          {label}
        </span>
      </div>
      {onViewAll && (
        <motion.button whileTap={{ scale: 0.93 }} onClick={onViewAll}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.72rem', fontWeight: 700, color: amber,
            fontFamily: 'Gilroy, sans-serif', padding: '3px 6px',
            display: 'flex', alignItems: 'center', gap: 4 }}>
          View all <span style={{ fontSize: '0.9rem' }}>→</span>
        </motion.button>
      )}
    </div>
  );
}

// ─── PILL CHIP ────────────────────────────────────────────────────────────────
export function Chip({ label, active, onClick, isDark }) {
  const amber = isDark ? '#e8a840' : '#c47a1e';
  const border = isDark ? 'rgba(196,122,30,0.14)' : 'rgba(196,122,30,0.12)';
  return (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onClick}
      style={{ padding: '8px 18px', borderRadius: 50, cursor: 'pointer', flexShrink: 0,
        background: active ? `linear-gradient(135deg,#7a4800,${amber})` : 'transparent',
        border: `1.5px solid ${active ? 'transparent' : border}`,
        color: active ? '#fff' : isDark ? '#7a6a52' : '#9a8a72',
        fontFamily: 'Gilroy, sans-serif', fontSize: '0.8rem',
        fontWeight: active ? 700 : 500,
        boxShadow: active ? '0 4px 16px rgba(196,122,30,0.35)' : 'none',
        transition: 'all 0.2s' }}>
      {label}
    </motion.button>
  );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export function Spinner({ isDark }) {
  const amber = isDark ? '#e8a840' : '#c47a1e';
  const border = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
      <motion.div animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 24, height: 24, borderRadius: '50%',
          border: `2.5px solid ${border}`, borderTopColor: amber }}/>
    </div>
  );
}