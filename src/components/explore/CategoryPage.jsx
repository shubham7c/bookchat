// src/components/explore/CategoryPage.jsx
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BookCard, Skeleton } from './ExploreUI';
import BookDetailPage from './BookDetailPage';
import { useCategoryBooksInfinite } from '../../hooks/useOpenLibrary';
import { useThemeStore } from '../../store/themeStore';

export default function CategoryPage({ cat, onBack }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [selectedBook, setSelectedBook] = useState(null);
  const { items: books, loading, loadingMore, loadMore, hasMore, total, categoryInfo } =
    useCategoryBooksInfinite(cat.subject, 20);

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
  const textF  = isDark ? '#4a3e2a' : '#c0b0a0';
  const amber  = isDark ? '#e8a840' : '#c47a1e';
  const border = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';

  return (
    <>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        style={{ position: 'fixed', inset: 0, zIndex: 60, background: pageBg,
          overflowY: 'auto', scrollbarWidth: 'none' }}>

        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: pageBg,
          borderBottom: `1px solid ${border}`, padding: '52px 18px 14px',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
              style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${border}`,
                background: cardBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
              <ArrowLeft size={18} color={textP}/>
            </motion.button>

            <div style={{ width: 44, height: 44, borderRadius: 14, fontSize: '1.35rem',
              background: cat.color + '22', border: `1.5px solid ${cat.color}38`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {cat.emoji}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: textP,
                fontFamily: 'Gilroy, sans-serif', letterSpacing: '-0.025em', margin: 0 }}>
                {cat.label}
              </h1>
              <p style={{ fontSize: '0.65rem', color: textF,
                fontFamily: 'Gilroy, sans-serif', margin: '2px 0 0' }}>
                {loading ? 'Loading…'
                  : categoryInfo
                    ? `${books.length} of ${categoryInfo.workCount.toLocaleString()} books`
                    : `${books.length} books`}
              </p>
            </div>
          </div>
        </div>

        {/* Books grid */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '18px 18px 100px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton w="100%" h={140} r={14} isDark={isDark}/>
                  <Skeleton w="80%" h={11} isDark={isDark}/>
                  <Skeleton w="55%" h={9}  isDark={isDark}/>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {books.map((b, i) => (
                  <motion.div key={`${b.key ?? b.title}-${i}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min((i % 20) * 0.04, 0.45) }}>
                    <BookCard
                      book={{ ...b, cover_i: b.cover_id ?? b.cover_i ?? b.covers?.[0] }}
                      onTap={setSelectedBook}
                      isDark={isDark}
                      width="100%"
                    />
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div ref={sentinelRef} style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                  {loadingMore && (
                    <motion.div animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 24, height: 24, borderRadius: '50%',
                        border: `2.5px solid ${border}`, borderTopColor: amber }}/>
                  )}
                </div>
              )}
              {!hasMore && books.length > 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0',
                  fontSize: '0.7rem', color: textF, fontFamily: 'Gilroy, sans-serif' }}>
                  All {categoryInfo?.workCount ?? books.length} books loaded ✓
                </div>
              )}
            </>
          )}
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