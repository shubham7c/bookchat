import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useThemeStore } from '../store/themeStore';
import BottomNav from '../components/shared/BottomNav';
import { Search, X, ChevronRight, Users, BookOpen, Star, ExternalLink, ArrowLeft, Loader } from 'lucide-react';

// ─── OPEN LIBRARY API HELPERS ─────────────────────────────────────────────────
const OL = 'https://openlibrary.org';
const COVERS = 'https://covers.openlibrary.org';

const coverUrl  = (id, size = 'M') => `${COVERS}/b/id/${id}-${size}.jpg`;
const authorImg = (key, size = 'M') => `${COVERS}/a/olid/${key}-${size}.jpg`;

async function searchBooks(q, limit = 12) {
  const r = await fetch(`${OL}/search.json?q=${encodeURIComponent(q)}&limit=${limit}&fields=key,title,author_name,author_key,cover_i,first_publish_year,ratings_average`);
  const d = await r.json();
  return (d.docs || []).filter(b => b.cover_i);
}

async function searchAuthors(q, limit = 8) {
  const r = await fetch(`${OL}/search/authors.json?q=${encodeURIComponent(q)}&limit=${limit}`);
  const d = await r.json();
  return (d.docs || []);
}

async function getAuthorDetail(olid) {
  const r = await fetch(`${OL}/authors/${olid}.json`);
  return r.json();
}

async function getAuthorWorks(olid, limit = 6) {
  const r = await fetch(`${OL}/authors/${olid}/works.json?limit=${limit}`);
  const d = await r.json();
  return (d.entries || []);
}

async function getCategoryBooks(subject, limit = 10) {
  const r = await fetch(`${OL}/subjects/${encodeURIComponent(subject.toLowerCase())}.json?limit=${limit}`);
  const d = await r.json();
  return (d.works || []).filter(w => w.cover_id);
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Fantasy',         subject: 'fantasy',          emoji: '🐉', color: '#6b3fa0' },
  { label: 'Mystery',         subject: 'mystery',          emoji: '🔍', color: '#4a3a2a' },
  { label: 'Science Fiction', subject: 'science_fiction',  emoji: '🚀', color: '#2a6a9a' },
  { label: 'Romance',         subject: 'romance',          emoji: '🌹', color: '#a04060' },
  { label: 'Biography',       subject: 'biography',        emoji: '👤', color: '#3a5a3a' },
  { label: 'History',         subject: 'history',          emoji: '🏛️', color: '#7a5a20' },
  { label: 'Horror',          subject: 'horror',           emoji: '🌑', color: '#3a1a1a' },
  { label: 'Poetry',          subject: 'poetry',           emoji: '✒️', color: '#6a3a5a' },
  { label: 'Philosophy',      subject: 'philosophy',       emoji: '🧠', color: '#4a4a7a' },
  { label: 'Self-Help',       subject: 'self-help',        emoji: '🌱', color: '#4a7a2a' },
  { label: 'Classics',        subject: 'classics',         emoji: '🏺', color: '#8b6914' },
  { label: 'Thriller',        subject: 'thriller',         emoji: '⚡', color: '#3a6a9a' },
];

const FEATURED_AUTHORS = [
  { key: 'OL23919A',  name: 'J.K. Rowling',       type: 'Fantasy Author'     },
  { key: 'OL31574A',  name: 'Stephen King',        type: 'Horror Author'      },
  { key: 'OL20629A',  name: 'George Orwell',       type: 'Literary Fiction'   },
  { key: 'OL18319A',  name: 'Agatha Christie',     type: 'Mystery Author'     },
  { key: 'OL26320A',  name: 'Paulo Coelho',        type: 'Fiction Author'     },
  { key: 'OL27349A',  name: 'Neil Gaiman',         type: 'Fantasy & Comics'   },
  { key: 'OL4107502A',name: 'Yuval Noah Harari',   type: 'Non-Fiction'        },
  { key: 'OL234664A', name: 'F. Scott Fitzgerald', type: 'Classic Literature' },
];

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton({ w, h, r = 8, isDark }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: w, height: h, borderRadius: r, flexShrink: 0,
        background: isDark ? 'rgba(196,122,30,0.08)' : 'rgba(196,122,30,0.07)' }}
    />
  );
}

// ─── BOOK COVER ───────────────────────────────────────────────────────────────
function BookCover({ coverId, title, size = 100, isDark }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr]       = useState(false);
  return (
    <div style={{ width: size, height: size * 1.45, borderRadius: 10, overflow: 'hidden',
      background: isDark ? '#1f1a10' : '#f0e8d0', position: 'relative', flexShrink: 0,
      boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.5)' : '0 6px 20px rgba(0,0,0,0.15)' }}>
      {!loaded && !err && <Skeleton w={size} h={size * 1.45} r={0} isDark={isDark} />}
      {!err && (
        <img src={coverUrl(coverId, 'M')} alt={title}
          onLoad={() => setLoaded(true)} onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}/>
      )}
      {err && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 8, textAlign: 'center' }}>
          <span style={{ fontSize: '0.6rem', color: isDark ? '#5a4e38' : '#b0a080',
            fontFamily: 'Gilroy, sans-serif', lineHeight: 1.3 }}>{title}</span>
        </div>
      )}
    </div>
  );
}

// ─── AUTHOR AVATAR ────────────────────────────────────────────────────────────
function AuthorAvatar({ olKey, name, size = 56, isDark }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr]       = useState(false);
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      background: isDark ? '#2a1e0c' : '#f0ddb0',
      border: `2px solid rgba(196,122,30,0.3)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(196,122,30,0.2)' }}>
      {!err && (
        <img src={authorImg(olKey, 'S')} alt={name}
          onLoad={() => setLoaded(true)} onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.3s', position: 'absolute' }}/>
      )}
      <span style={{ fontSize: size * 0.32, fontWeight: 800, color: isDark ? '#e8a840' : '#8b6914',
        fontFamily: 'Gilroy, sans-serif', position: 'relative', zIndex: 1 }}>{initials}</span>
    </div>
  );
}

// ─── AUTHOR DETAIL SHEET ──────────────────────────────────────────────────────
function AuthorSheet({ author, isDark, onClose }) {
  const [detail, setDetail]   = useState(null);
  const [works, setWorks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [d, w] = await Promise.all([
          getAuthorDetail(author.key),
          getAuthorWorks(author.key, 6),
        ]);
        setDetail(d);
        setWorks(w);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, [author.key]);

  const bio = detail?.bio?.value || detail?.bio || '';
  const bioShort = typeof bio === 'string' ? bio.slice(0, 280) : '';

  const cardBg  = isDark ? '#171208' : '#fffdf6';
  const pageBg  = isDark ? '#0f0d09' : '#faf6ef';
  const textP   = isDark ? '#f0e8d8' : '#1a1208';
  const textM   = isDark ? '#8a7a60' : '#8a7560';
  const textF   = isDark ? '#5a4e38' : '#b0a090';
  const border  = isDark ? 'rgba(196,122,30,0.12)' : 'rgba(196,122,30,0.1)';
  const amber   = isDark ? '#e8a840' : '#c47a1e';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(8,5,2,0.6)',
        backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '90dvh',
          background: pageBg, borderRadius: '26px 26px 0 0',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: isDark ? '0 -10px 60px rgba(0,0,0,0.8)' : '0 -10px 60px rgba(0,0,0,0.15)' }}>

        {/* Handle */}
        <div style={{ width: 38, height: 4, borderRadius: 2, background: border,
          margin: '12px auto 0', flexShrink: 0 }}/>

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 40 }}>
          {/* Hero */}
          <div style={{ padding: '20px 20px 0', position: 'relative' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Large avatar */}
              <div style={{ width: 80, height: 80, borderRadius: 22, overflow: 'hidden', flexShrink: 0,
                background: isDark ? '#2a1e0c' : '#f0ddb0',
                border: `2.5px solid rgba(196,122,30,0.35)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 28px rgba(196,122,30,0.25)` }}>
                <img src={authorImg(author.key, 'M')}
                  onError={e => { e.target.style.display='none'; }}
                  alt={author.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: amber,
                  fontFamily: 'Gilroy, sans-serif', position: 'absolute' }}>
                  {author.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: textP,
                  fontFamily: 'Gilroy, sans-serif', letterSpacing: '-0.02em', marginBottom: 3 }}>
                  {author.name}
                </h2>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: amber,
                  fontFamily: 'Gilroy, sans-serif', marginBottom: 8 }}>
                  {author.type || 'Author'}
                </div>

                {/* Stats row */}
                {detail && !loading && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    {detail.work_count > 0 && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: textP, fontFamily: 'Gilroy, sans-serif' }}>
                          {detail.work_count}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: textF, textTransform: 'uppercase',
                          letterSpacing: '0.06em', fontFamily: 'Gilroy, sans-serif' }}>Works</div>
                      </div>
                    )}
                    {detail.birth_date && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: textP, fontFamily: 'Gilroy, sans-serif' }}>
                          {detail.birth_date?.slice(-4) || '—'}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: textF, textTransform: 'uppercase',
                          letterSpacing: '0.06em', fontFamily: 'Gilroy, sans-serif' }}>Born</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Follow */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setFollowing(p => !p)}
                style={{ padding: '9px 16px', borderRadius: 50, border: 'none', cursor: 'pointer',
                  background: following ? border : `linear-gradient(135deg,#7a4800,${amber})`,
                  color: following ? amber : '#fff',
                  fontFamily: 'Gilroy, sans-serif', fontSize: '0.78rem', fontWeight: 700,
                  boxShadow: following ? 'none' : `0 4px 14px rgba(196,122,30,0.35)`,
                  transition: 'all 0.25s', flexShrink: 0 }}>
                {following ? '✓ Following' : '+ Follow'}
              </motion.button>
            </div>

            {/* Bio */}
            {loading ? (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton w="100%" h={12} isDark={isDark}/>
                <Skeleton w="80%" h={12} isDark={isDark}/>
                <Skeleton w="90%" h={12} isDark={isDark}/>
              </div>
            ) : bioShort ? (
              <p style={{ marginTop: 14, fontSize: '0.8rem', color: textM, lineHeight: 1.65,
                fontFamily: 'Gilroy, sans-serif', borderTop: `1px solid ${border}`, paddingTop: 12 }}>
                {bioShort}{bio.length > 280 ? '…' : ''}
              </p>
            ) : null}
          </div>

          {/* Works */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: textF,
                letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif' }}>
                Notable Works
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', gap: 12, overflowX: 'hidden' }}>
                {[...Array(4)].map((_,i) => <Skeleton key={i} w={80} h={116} r={10} isDark={isDark}/>)}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
                scrollbarWidth: 'none' }}>
                {works.map((w, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    style={{ flexShrink: 0 }}>
                    <div style={{ width: 80, height: 116, borderRadius: 10, overflow: 'hidden',
                      background: isDark ? '#1f1a10' : '#f0e8d0',
                      boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.12)' }}>
                      {w.covers?.[0] ? (
                        <img src={coverUrl(w.covers[0], 'S')} alt={w.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                          <span style={{ fontSize: '0.58rem', color: textF, textAlign: 'center',
                            fontFamily: 'Gilroy, sans-serif', lineHeight: 1.3 }}>{w.title}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ width: 80, marginTop: 6, fontSize: '0.6rem', color: textM,
                      fontFamily: 'Gilroy, sans-serif', lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.title}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          {detail?.awards?.length > 0 && (
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: textF,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: 'Gilroy, sans-serif', marginBottom: 10 }}>Achievements</div>
              {detail.awards.slice(0, 3).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 10,
                  background: isDark ? 'rgba(196,122,30,0.06)' : 'rgba(196,122,30,0.05)',
                  border: `1px solid ${border}`, marginBottom: 6 }}>
                  <span>🏆</span>
                  <span style={{ fontSize: '0.78rem', color: textP, fontFamily: 'Gilroy, sans-serif' }}>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* Wikipedia link */}
          {detail?.wikipedia && (
            <div style={{ padding: '16px 20px 0' }}>
              <a href={detail.wikipedia} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 14px', borderRadius: 12,
                  background: isDark ? 'rgba(196,122,30,0.06)' : 'rgba(196,122,30,0.05)',
                  border: `1px solid ${border}`, textDecoration: 'none' }}>
                <ExternalLink size={14} color={amber}/>
                <span style={{ fontSize: '0.8rem', color: amber, fontWeight: 600,
                  fontFamily: 'Gilroy, sans-serif' }}>View on Wikipedia</span>
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── CATEGORY RESULTS SHEET ───────────────────────────────────────────────────
function CategorySheet({ cat, isDark, onClose }) {
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const pageBg = isDark ? '#0f0d09' : '#faf6ef';
  const cardBg = isDark ? '#171208' : '#fffdf6';
  const textP  = isDark ? '#f0e8d8' : '#1a1208';
  const textM  = isDark ? '#8a7a60' : '#8a7560';
  const textF  = isDark ? '#5a4e38' : '#b0a090';
  const border = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';

  useEffect(() => {
    getCategoryBooks(cat.subject).then(b => { setBooks(b); setLoading(false); });
  }, [cat.subject]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 70,
        background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(8,5,2,0.6)',
        backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '88dvh',
          background: pageBg, borderRadius: '26px 26px 0 0', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: isDark ? '0 -10px 60px rgba(0,0,0,0.8)' : '0 -10px 60px rgba(0,0,0,0.15)' }}>

        <div style={{ width: 38, height: 4, borderRadius: 2,
          background: isDark ? 'rgba(196,122,30,0.15)' : 'rgba(196,122,30,0.12)',
          margin: '12px auto 0', flexShrink: 0 }}/>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center',
          gap: 12, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, fontSize: '1.3rem',
            background: cat.color + '20', border: `1px solid ${cat.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cat.emoji}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: textP,
              fontFamily: 'Gilroy, sans-serif', letterSpacing: '-0.02em' }}>{cat.label}</h3>
            <p style={{ fontSize: '0.68rem', color: textM, fontFamily: 'Gilroy, sans-serif' }}>
              Top books in this genre
            </p>
          </div>
        </div>

        {/* Books grid */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 40px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {[...Array(6)].map((_,i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton w={100} h={145} r={10} isDark={isDark}/>
                  <Skeleton w={100} h={10} isDark={isDark}/>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {books.map((b, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10,
                    overflow: 'hidden', background: isDark ? '#1f1a10' : '#f0e8d0',
                    boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.5)' : '0 6px 20px rgba(0,0,0,0.12)' }}>
                    {b.cover_id ? (
                      <img src={coverUrl(b.cover_id, 'M')} alt={b.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                        <span style={{ fontSize: '0.6rem', color: textF, textAlign: 'center',
                          fontFamily: 'Gilroy, sans-serif' }}>{b.title}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: textP,
                      fontFamily: 'Gilroy, sans-serif', lineHeight: 1.3,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' }}>{b.title}</div>
                    {b.authors?.[0]?.name && (
                      <div style={{ fontSize: '0.62rem', color: textM,
                        fontFamily: 'Gilroy, sans-serif', marginTop: 2 }}>
                        {b.authors[0].name}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SEARCH RESULTS ───────────────────────────────────────────────────────────
function SearchResults({ query, isDark }) {
  const [books, setBooks]     = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('books');

  const textP  = isDark ? '#f0e8d8' : '#1a1208';
  const textM  = isDark ? '#8a7a60' : '#8a7560';
  const textF  = isDark ? '#5a4e38' : '#b0a090';
  const amber  = isDark ? '#e8a840' : '#c47a1e';
  const border = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    Promise.all([
      searchBooks(query, 12),
      searchAuthors(query, 6),
    ]).then(([b, a]) => {
      setBooks(b); setAuthors(a); setLoading(false);
    });
  }, [query]);

  const tabs = [
    { id: 'books',   label: `Books ${books.length ? `(${books.length})` : ''}` },
    { id: 'authors', label: `Authors ${authors.length ? `(${authors.length})` : ''}` },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <motion.button key={t.id} onClick={() => setTab(t.id)}
            whileTap={{ scale: 0.96 }}
            style={{ padding: '8px 16px', borderRadius: 50,
              background: tab === t.id ? `linear-gradient(135deg,#7a4800,${amber})` : 'transparent',
              border: `1.5px solid ${tab === t.id ? 'transparent' : border}`,
              color: tab === t.id ? '#fff' : textM,
              fontFamily: 'Gilroy, sans-serif', fontSize: '0.8rem',
              fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer',
              boxShadow: tab === t.id ? `0 4px 14px rgba(196,122,30,0.3)` : 'none',
              transition: 'all 0.22s' }}>
            {t.label}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[...Array(6)].map((_,i) => (
            <div key={i}><Skeleton w={100} h={145} r={10} isDark={isDark}/></div>
          ))}
        </div>
      ) : tab === 'books' ? (
        books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: textF,
            fontSize: '0.85rem', fontFamily: 'Gilroy, sans-serif' }}>
            No books found for "{query}"
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {books.map((b, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10,
                  overflow: 'hidden', background: isDark ? '#1f1a10' : '#f0e8d0',
                  boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.4)' : '0 6px 20px rgba(0,0,0,0.1)' }}>
                  {b.cover_i && (
                    <img src={coverUrl(b.cover_i, 'M')} alt={b.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: textP,
                    fontFamily: 'Gilroy, sans-serif', overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', lineHeight: 1.35 }}>{b.title}</div>
                  {b.author_name?.[0] && (
                    <div style={{ fontSize: '0.6rem', color: textM, fontFamily: 'Gilroy, sans-serif', marginTop: 2 }}>
                      {b.author_name[0]}
                    </div>
                  )}
                  {b.first_publish_year && (
                    <div style={{ fontSize: '0.58rem', color: textF, fontFamily: 'Gilroy, sans-serif' }}>
                      {b.first_publish_year}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        authors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: textF,
            fontSize: '0.85rem', fontFamily: 'Gilroy, sans-serif' }}>
            No authors found for "{query}"
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {authors.map((a, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 14,
                  background: isDark ? '#171208' : '#fffdf6',
                  border: `1px solid ${border}` }}>
                <AuthorAvatar olKey={a.key} name={a.name} size={46} isDark={isDark}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: textP,
                    fontFamily: 'Gilroy, sans-serif' }}>{a.name}</div>
                  {a.top_subjects?.[0] && (
                    <div style={{ fontSize: '0.68rem', color: amber, fontFamily: 'Gilroy, sans-serif', marginTop: 2 }}>
                      {a.top_subjects[0]}
                    </div>
                  )}
                  {a.work_count && (
                    <div style={{ fontSize: '0.62rem', color: textF, fontFamily: 'Gilroy, sans-serif' }}>
                      {a.work_count} works
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── MAIN EXPLORE PAGE ────────────────────────────────────────────────────────
export default function Explore() {
  const { theme }   = useThemeStore();
  const isDark      = theme === 'dark';
  const pageRef     = useRef(null);

  const [query, setQuery]           = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [searching, setSearching]   = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedCat, setSelectedCat]       = useState(null);
  const [trendBooks, setTrendBooks]         = useState([]);
  const [trendLoading, setTrendLoading]     = useState(true);
  const inputRef = useRef(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  // Trending books on mount
  useEffect(() => {
    searchBooks('bestseller fiction', 8).then(b => {
      setTrendBooks(b); setTrendLoading(false);
    });
  }, []);

  // Page entrance
  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  }, []);

  // Theme tokens
  const pageBg  = isDark ? '#0f0d09' : '#faf6ef';
  const cardBg  = isDark ? '#171208' : '#fffdf6';
  const textP   = isDark ? '#f0e8d8' : '#1a1208';
  const textM   = isDark ? '#8a7a60' : '#8a7560';
  const textF   = isDark ? '#5a4e38' : '#b0a090';
  const amber   = isDark ? '#e8a840' : '#c47a1e';
  const border  = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';
  const inputBg = isDark ? '#171208' : '#fffdf6';

  const isSearching = debouncedQ.length > 1;

  return (
    <div ref={pageRef} style={{ minHeight: '100dvh', background: pageBg,
      fontFamily: 'Gilroy, sans-serif' }}>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-15%', width: '55vw', height: '55vw',
          borderRadius: '50%', background: isDark
            ? 'radial-gradient(circle,rgba(196,122,30,0.04) 0%,transparent 65%)'
            : 'radial-gradient(circle,rgba(196,122,30,0.07) 0%,transparent 65%)' }}/>
        <div style={{ position: 'absolute', bottom: '10%', left: '-15%', width: '45vw', height: '45vw',
          borderRadius: '50%', background: isDark
            ? 'radial-gradient(circle,rgba(196,122,30,0.02) 0%,transparent 65%)'
            : 'radial-gradient(circle,rgba(196,122,30,0.04) 0%,transparent 65%)' }}/>
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto',
        padding: '20px 14px 100px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke={amber} strokeWidth="1.8"/>
              <path d="M17 17L21 21" stroke={amber} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: textP, letterSpacing: '-0.02em' }}>
              Explore
            </span>
          </div>

          {/* Search bar */}
          <motion.div
            animate={{ scale: searching ? 1.01 : 1 }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 14, zIndex: 2, display: 'flex' }}>
              <Search size={16} color={query ? amber : textF} strokeWidth={2}/>
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearching(true)}
              onBlur={() => !query && setSearching(false)}
              placeholder="Search books, authors, genres…"
              style={{ width: '100%', padding: '13px 42px 13px 42px',
                borderRadius: 16, outline: 'none',
                background: inputBg,
                border: `1.5px solid ${query ? amber + '50' : border}`,
                color: textP, fontFamily: 'Gilroy, sans-serif', fontSize: '0.88rem',
                boxShadow: query ? `0 0 0 3px rgba(196,122,30,0.08)` : 'none',
                transition: 'all 0.25s' }}
            />
            <AnimatePresence>
              {query && (
                <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => { setQuery(''); setSearching(false); }}
                  style={{ position: 'absolute', right: 12, background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', color: textF }}>
                  <X size={16}/>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Search results OR main content ── */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div key="search"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SearchResults query={debouncedQ} isDark={isDark}/>
            </motion.div>
          ) : (
            <motion.div key="main"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* ── Featured Authors ── */}
              <section style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: textF,
                    letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Featured Authors
                  </span>
                  <span style={{ fontSize: '0.7rem', color: amber, fontWeight: 600,
                    cursor: 'pointer' }}>View all</span>
                </div>

                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6,
                  scrollbarWidth: 'none', margin: '0 -14px', padding: '0 14px 6px' }}>
                  {FEATURED_AUTHORS.map((a, i) => (
                    <motion.div key={a.key}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedAuthor(a)}
                      style={{ flexShrink: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 8, cursor: 'pointer', width: 72 }}>

                      {/* Avatar with glow ring */}
                      <div style={{ position: 'relative' }}>
                        <motion.div
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                          style={{ position: 'absolute', inset: -3, borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(196,122,30,0.35), transparent 70%)`,
                            pointerEvents: 'none' }}/>
                        <AuthorAvatar olKey={a.key} name={a.name} size={56} isDark={isDark}/>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: textP,
                          lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {a.name.split(' ').slice(-1)[0]}
                        </div>
                        <div style={{ fontSize: '0.56rem', color: amber, marginTop: 2, fontWeight: 600 }}>
                          {a.type.split(' ')[0]}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ── Trending Books ── */}
              <section style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: '0.9rem' }}>📚</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: textF,
                      letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Trending Books
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6,
                  scrollbarWidth: 'none', margin: '0 -14px', padding: '0 14px 6px' }}>
                  {trendLoading
                    ? [...Array(5)].map((_,i) => (
                        <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <Skeleton w={90} h={130} r={10} isDark={isDark}/>
                          <Skeleton w={90} h={10} isDark={isDark}/>
                        </div>
                      ))
                    : trendBooks.map((b, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                          style={{ flexShrink: 0, width: 90, cursor: 'pointer' }}>
                          <BookCover coverId={b.cover_i} title={b.title} size={90} isDark={isDark}/>
                          <div style={{ marginTop: 7 }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: textP,
                              lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box',
                              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {b.title}
                            </div>
                            {b.author_name?.[0] && (
                              <div style={{ fontSize: '0.58rem', color: textM, marginTop: 2 }}>
                                {b.author_name[0]}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                  }
                </div>
              </section>

              {/* ── Browse by Category ── */}
              <section style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: textF,
                    letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Browse by Genre
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {CATEGORIES.map((cat, i) => (
                    <motion.button key={cat.label}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCat(cat)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 14px', borderRadius: 16, cursor: 'pointer',
                        background: isDark
                          ? `linear-gradient(135deg, ${cat.color}18, ${cat.color}08)`
                          : `linear-gradient(135deg, ${cat.color}12, ${cat.color}05)`,
                        border: `1px solid ${cat.color}28`,
                        boxShadow: isDark ? `0 2px 12px ${cat.color}15` : `0 2px 12px ${cat.color}10`,
                        transition: 'all 0.22s', textAlign: 'left' }}>

                      <div style={{ width: 36, height: 36, borderRadius: 11, fontSize: '1.1rem',
                        background: cat.color + '20',
                        border: `1px solid ${cat.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0 }}>
                        {cat.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 700, color: textP, lineHeight: 1.2 }}>
                          {cat.label}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: cat.color, fontWeight: 600,
                          marginTop: 2, opacity: 0.8 }}>
                          Tap to explore →
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav active="explore"/>

      {/* Modals */}
      <AnimatePresence>
        {selectedAuthor && (
          <AuthorSheet
            author={selectedAuthor}
            isDark={isDark}
            onClose={() => setSelectedAuthor(null)}
          />
        )}
        {selectedCat && (
          <CategorySheet
            cat={selectedCat}
            isDark={isDark}
            onClose={() => setSelectedCat(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        html, body { background: ${pageBg} !important; margin: 0; padding: 0; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        input::placeholder { color: ${textF}; }
      `}</style>
    </div>
  );
}