// src/components/explore/AllAuthorsPage.jsx
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X } from 'lucide-react';
import { AuthorCard, Skeleton } from './ExploreUI';
import AuthorDetailPage from './AuthorDetailPage';
import { FEATURED_AUTHORS } from '../../api/openLibrary';
import { useAuthorSearchInfinite } from '../../hooks/useOpenLibrary';
import { useThemeStore } from '../../store/themeStore';

export default function AllAuthorsPage({ onBack }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);

  const isSearching = query.length >= 2;
  const { items: searchResults, loading, loadingMore, loadMore, hasMore, total } =
    useAuthorSearchInfinite(isSearching ? query : null, 20);

  const authors = isSearching ? searchResults : FEATURED_AUTHORS;

  const observerRef = useRef(null);
  const sentinelRef = useCallback(node => {
    if (!node) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && isSearching) loadMore();
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
  }, [hasMore, loadingMore, isSearching, loadMore]);

  const pageBg  = isDark ? '#0f0d09' : '#faf6ef';
  const cardBg  = isDark ? '#171208' : '#fffdf6';
  const textP   = isDark ? '#f0e8d8' : '#1a1208';
  const textF   = isDark ? '#4a3e2a' : '#c0b0a0';
  const amber   = isDark ? '#e8a840' : '#c47a1e';
  const border  = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';
  const inputBg = isDark ? '#171208' : '#fffdf6';

  return (
    <>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        style={{ position: 'fixed', inset: 0, zIndex: 60, background: pageBg,
          overflowY: 'auto', scrollbarWidth: 'none' }}>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '56px 18px 100px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
              style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${border}`,
                background: cardBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
              <ArrowLeft size={18} color={textP}/>
            </motion.button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: textP,
                fontFamily: 'Gilroy, sans-serif', letterSpacing: '-0.025em', margin: 0 }}>
                Authors
              </h1>
              <p style={{ fontSize: '0.67rem', color: textF,
                fontFamily: 'Gilroy, sans-serif', margin: '3px 0 0' }}>
                {isSearching && total !== null
                  ? `${total.toLocaleString()} found`
                  : 'Discover writers you\'ll love'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <Search size={15} color={query ? amber : textF}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}/>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search any author…"
              style={{ width: '100%', padding: '13px 42px 13px 40px', borderRadius: 16,
                outline: 'none', background: inputBg,
                border: `1.5px solid ${query ? amber+'60' : border}`,
                color: textP, fontFamily: 'Gilroy, sans-serif', fontSize: '0.88rem',
                boxShadow: query ? '0 0 0 4px rgba(196,122,30,0.07)' : 'none',
                transition: 'all 0.22s' }}/>
            {query && (
              <button onClick={() => setQuery('')}
                style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: textF, display: 'flex' }}>
                <X size={15}/>
              </button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 18, background: cardBg, border: `1px solid ${border}` }}>
                  <Skeleton w={52} h={52} r={14} isDark={isDark}/>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton w="52%" h={13} isDark={isDark}/>
                    <Skeleton w="32%" h={10} isDark={isDark}/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {authors.map((a, i) => (
                <motion.div key={a.key ?? i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.28) }}>
                  <AuthorCard author={a} onTap={setSelected} isDark={isDark}/>
                </motion.div>
              ))}

              {isSearching && hasMore && (
                <div ref={sentinelRef} style={{ padding: '16px 0',
                  display: 'flex', justifyContent: 'center' }}>
                  {loadingMore && (
                    <motion.div animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 22, height: 22, borderRadius: '50%',
                        border: `2px solid ${border}`,
                        borderTopColor: amber }}/>
                  )}
                </div>
              )}
              {isSearching && !hasMore && authors.length > 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0',
                  fontSize: '0.7rem', color: textF, fontFamily: 'Gilroy, sans-serif' }}>
                  All {total} authors ✓
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <AuthorDetailPage key={selected.key}
            author={selected} onBack={() => setSelected(null)}/>
        )}
      </AnimatePresence>
    </>
  );
}