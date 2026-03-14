// src/components/explore/AuthorDetailPage.jsx
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AuthorAvatar, BookCard, Skeleton, Spinner } from './ExploreUI';
import BookDetailPage from './BookDetailPage';
import { useAuthorDetail, useAuthorWorksInfinite } from '../../hooks/useOpenLibrary';
import { useThemeStore } from '../../store/themeStore';

export default function AuthorDetailPage({ author, onBack }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const { data: detail, loading: detailLoading } = useAuthorDetail(author.key);
  const { items: works, loading: worksLoading, loadingMore, loadMore, hasMore, total } =
    useAuthorWorksInfinite(author.key, 20);

  const [following,    setFollowing]    = useState(false);
  const [bgLoaded,     setBgLoaded]     = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const observerRef = useRef(null);
  const sentinelRef = useCallback(node => {
    if (!node) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore();
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
  }, [hasMore, loadingMore, loadMore]);

  const pageBg = isDark ? '#0f0d09' : '#faf6ef';
  const cardBg = isDark ? '#171208' : '#fffdf6';
  const textP  = isDark ? '#f0e8d8' : '#1a1208';
  const textM  = isDark ? '#7a6a52' : '#9a8a72';
  const textF  = isDark ? '#4a3e2a' : '#c0b0a0';
  const amber  = isDark ? '#e8a840' : '#c47a1e';
  const border = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';

  const bio = detail?.bio?.value ?? detail?.bio ?? '';
  const bioText = typeof bio === 'string' ? bio.replace(/\n+/g,' ').trim() : '';

  return (
    <>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        style={{ position: 'fixed', inset: 0, zIndex: 60, background: pageBg,
          overflowY: 'auto', scrollbarWidth: 'none' }}>

        {/* ── HERO ── */}
        <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
          <img src={`https://covers.openlibrary.org/a/olid/${author.key}-L.jpg`} alt=""
            onLoad={() => setBgLoaded(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', filter: 'blur(28px) saturate(0.5) brightness(0.4)',
              transform: 'scale(1.15)', opacity: bgLoaded ? 1 : 0, transition: 'opacity 0.6s' }}/>
          <div style={{ position: 'absolute', inset: 0,
            background: isDark
              ? 'linear-gradient(180deg, transparent 0%, #0f0d09 100%)'
              : 'linear-gradient(180deg, transparent 0%, #faf6ef 100%)' }}/>

          <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
            style={{ position: 'absolute', top: 52, left: 18, zIndex: 10,
              width: 42, height: 42, borderRadius: 14,
              background: isDark ? 'rgba(15,13,9,0.72)' : 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(16px)', border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
            <ArrowLeft size={18} color={textP}/>
          </motion.button>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 18px 100px' }}>

          {/* ── Profile ── */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end',
            marginTop: -60, marginBottom: 20, position: 'relative', zIndex: 2 }}>

            <div style={{ position: 'relative', flexShrink: 0 }}>
              <motion.div
                animate={{ opacity: [0.2, 0.65, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ position: 'absolute', inset: -8, borderRadius: 22,
                  background: 'radial-gradient(circle,rgba(196,122,30,0.4) 0%,transparent 70%)' }}/>
              <AuthorAvatar olKey={author.key} name={author.name} size={80} isDark={isDark}/>
            </div>

            <div style={{ flex: 1, paddingBottom: 4 }}>
              <h1 style={{ fontSize: '1.22rem', fontWeight: 800, color: textP,
                fontFamily: 'Gilroy, sans-serif', letterSpacing: '-0.025em',
                margin: '0 0 4px', lineHeight: 1.2 }}>{author.name}</h1>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: amber,
                fontFamily: 'Gilroy, sans-serif' }}>{author.type ?? 'Author'}</div>
            </div>

            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setFollowing(p => !p)}
              style={{ padding: '10px 20px', borderRadius: 50, border: 'none', cursor: 'pointer',
                flexShrink: 0, marginBottom: 4,
                background: following
                  ? `rgba(196,122,30,0.12)`
                  : `linear-gradient(135deg,#8a5000,${amber})`,
                color: following ? amber : '#fff',
                fontFamily: 'Gilroy, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                boxShadow: following ? 'none' : '0 4px 18px rgba(196,122,30,0.42)',
                transition: 'all 0.25s', border: following ? `1.5px solid ${border}` : 'none' }}>
              {following ? '✓ Following' : '+ Follow'}
            </motion.button>
          </div>

          {/* ── Stats ── */}
          {!detailLoading && detail && (() => {
            const stats = [
              detail.work_count && { l: 'Works',  v: detail.work_count?.toLocaleString() },
              detail.birth_date && { l: 'Born',   v: detail.birth_date?.slice(-4) },
              detail.death_date && { l: 'Died',   v: detail.death_date?.slice(-4) },
            ].filter(Boolean);
            return stats.length > 0 ? (
              <div style={{ display: 'flex', gap: 0, marginBottom: 20,
                background: cardBg, borderRadius: 18, border: `1px solid ${border}`,
                overflow: 'hidden',
                boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.05)' }}>
                {stats.map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '16px 10px',
                    borderRight: i < stats.length-1 ? `1px solid ${border}` : 'none' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: textP,
                      fontFamily: 'Gilroy, sans-serif' }}>{s.v}</div>
                    <div style={{ fontSize: '0.57rem', color: textF, textTransform: 'uppercase',
                      letterSpacing: '0.08em', fontFamily: 'Gilroy, sans-serif', marginTop: 3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          {/* ── About ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: textF,
              letterSpacing: '0.13em', textTransform: 'uppercase',
              fontFamily: 'Gilroy, sans-serif', marginBottom: 12 }}>About</div>
            {detailLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[1, 0.88, 0.94, 0.75].map((w, i) => (
                  <Skeleton key={i} w={`${w*100}%`} h={12} isDark={isDark}/>
                ))}
              </div>
            ) : bioText ? (
              <p style={{ fontSize: '0.85rem', color: textM, lineHeight: 1.78,
                fontFamily: 'Gilroy, sans-serif', margin: 0 }}>{bioText}</p>
            ) : (
              <p style={{ fontSize: '0.84rem', color: textF, fontFamily: 'Gilroy, sans-serif',
                margin: 0, fontStyle: 'italic' }}>No biography available.</p>
            )}
          </div>

          {/* ── Known For ── */}
          {detail?.subjects?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: textF,
                letterSpacing: '0.13em', textTransform: 'uppercase',
                fontFamily: 'Gilroy, sans-serif', marginBottom: 12 }}>Known For</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {detail.subjects.slice(0, 10).map((s, i) => (
                  <span key={i} style={{ padding: '6px 14px', borderRadius: 50,
                    fontSize: '0.72rem', fontFamily: 'Gilroy, sans-serif', fontWeight: 600,
                    background: isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.07)',
                    border: `1px solid ${border}`, color: amber }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Wikipedia ── */}
          {detail?.wikipedia && (
            <div style={{ marginBottom: 28 }}>
              <a href={detail.wikipedia} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 18px', borderRadius: 16, textDecoration: 'none',
                  background: cardBg, border: `1px solid ${border}`,
                  boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.04)' }}>
                <ExternalLink size={15} color={amber}/>
                <span style={{ fontSize: '0.84rem', color: amber, fontWeight: 700,
                  fontFamily: 'Gilroy, sans-serif' }}>Read more on Wikipedia</span>
              </a>
            </div>
          )}

          {/* ── All Works ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: textF,
                letterSpacing: '0.13em', textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif' }}>
                All Works
              </div>
              {total !== null && (
                <div style={{ fontSize: '0.68rem', color: textF, fontFamily: 'Gilroy, sans-serif' }}>
                  {works.length} of {total}
                </div>
              )}
            </div>

            {worksLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[...Array(9)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton w="100%" h={140} r={14} isDark={isDark}/>
                    <Skeleton w="75%" h={11} isDark={isDark}/>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {works.map((w, i) => (
                    <motion.div key={`${w.key}-${i}`}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min((i % 20) * 0.04, 0.45) }}>
                      <BookCard
                        book={{ ...w, cover_i: w.covers?.[0] }}
                        onTap={setSelectedBook}
                        isDark={isDark}
                        width="100%"
                      />
                    </motion.div>
                  ))}
                </div>
                {hasMore && <div ref={sentinelRef}><Spinner isDark={isDark}/></div>}
                {!hasMore && works.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0',
                    fontSize: '0.7rem', color: textF, fontFamily: 'Gilroy, sans-serif' }}>
                    All {total} works ✓
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedBook && (
          <BookDetailPage key={selectedBook.key ?? selectedBook.title}
            book={selectedBook} onBack={() => setSelectedBook(null)}/>
        )}
      </AnimatePresence>
    </>
  );
}