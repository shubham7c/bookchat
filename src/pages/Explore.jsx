// src/pages/Explore.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Search, X, TrendingUp, Users, Grid } from 'lucide-react';

import { useThemeStore }    from '../store/themeStore';
import BottomNav            from '../components/shared/BottomNav';
import { FEATURED_AUTHORS, CATEGORIES } from '../api/openLibrary';
import { useDebouncedSearch, useTrendingBooks, useBookSearchInfinite } from '../hooks/useOpenLibrary';
import { AuthorCard, BookCard, Skeleton, SectionHeader } from '../components/explore/ExploreUI';
import AuthorDetailPage from '../components/explore/AuthorDetailPage';
import AllAuthorsPage   from '../components/explore/AllAuthorsPage';
import CategoryPage     from '../components/explore/CategoryPage';
import SearchResults    from '../components/explore/SearchResults';
import BookDetailPage   from '../components/explore/BookDetailPage';

// ─── TRENDING BOOKS ROW ───────────────────────────────────────────────────────
function TrendingRow({ isDark, onSelectBook }) {
  const { data: books, loading } = useTrendingBooks(12);
  return (
    <div style={{ margin: '0 -18px', padding: '2px 18px 8px',
      overflowX: 'auto', display: 'flex', gap: 14, scrollbarWidth: 'none' }}>
      {loading
        ? [...Array(5)].map((_, i) => (
            <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 9, width: 116 }}>
              <Skeleton w={116} h={176} r={14} isDark={isDark}/>
              <Skeleton w={90}  h={11}  isDark={isDark}/>
              <Skeleton w={70}  h={9}   isDark={isDark}/>
            </div>
          ))
        : (books || []).map((b, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.07, 0.5), ease: [0.16, 1, 0.3, 1] }}>
              <BookCard book={b} onTap={onSelectBook} isDark={isDark} width={116}/>
            </motion.div>
          ))
      }
    </div>
  );
}

// ─── FEATURED AUTHORS ROW — horizontal rect cards ────────────────────────────
function AuthorsRow({ isDark, onSelectAuthor }) {
  return (
    <div style={{ margin: '0 -18px', padding: '2px 18px 8px',
      overflowX: 'auto', display: 'flex', gap: 12, scrollbarWidth: 'none' }}>
      {FEATURED_AUTHORS.map((a, i) => (
        <motion.div key={a.key}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.06, 0.45), ease: [0.16, 1, 0.3, 1] }}>
          <AuthorCard author={a} onTap={onSelectAuthor} isDark={isDark} compact={true}/>
        </motion.div>
      ))}
    </div>
  );
}

// ─── CATEGORY GRID — 2 column, premium pill design ───────────────────────────
function CategoryGrid({ isDark, onSelectCat }) {
  const textP = isDark ? '#f0e8d8' : '#1a1208';
  const textF = isDark ? '#4a3e2a' : '#c0b0a0';
  const border = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {CATEGORIES.map((cat, i) => (
        <motion.button key={cat.label}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 + Math.min(i * 0.04, 0.38), ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => onSelectCat(cat)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            borderRadius: 18, cursor: 'pointer', textAlign: 'left',
            background: isDark
              ? `linear-gradient(135deg, ${cat.color}18, ${cat.color}0a)`
              : `linear-gradient(135deg, ${cat.color}12, ${cat.color}06)`,
            border: `1px solid ${cat.color}28`,
            boxShadow: isDark
              ? `0 4px 20px ${cat.color}14, inset 0 1px 0 ${cat.color}10`
              : `0 4px 20px ${cat.color}10`,
            transition: 'all 0.22s ease' }}>

          {/* Icon container */}
          <div style={{ width: 42, height: 42, borderRadius: 13, fontSize: '1.2rem',
            background: cat.color + '20', border: `1px solid ${cat.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {cat.emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: textP,
              fontFamily: 'Gilroy, sans-serif', lineHeight: 1.2, marginBottom: 3 }}>
              {cat.label}
            </div>
            <div style={{ fontSize: '0.6rem', color: cat.color, fontWeight: 600,
              opacity: 0.75, fontFamily: 'Gilroy, sans-serif' }}>
              Browse →
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ─── MAIN EXPLORE PAGE ───────────────────────────────────────────────────────
export default function Explore() {
  const { theme } = useThemeStore();
  const isDark    = theme === 'dark';
  const pageRef   = useRef(null);

  const [query,          setQuery]          = useState('');
  const [focused,        setFocused]        = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedCat,    setSelectedCat]    = useState(null);
  const [selectedBook,   setSelectedBook]   = useState(null);
  const [showAllAuthors, setShowAllAuthors] = useState(false);

  const { authors: srAuthors, loading: srLoading, hasQuery, debounced } =
    useDebouncedSearch(query, 450);

  const {
    items: srBooks, loadingMore: srLoadingMore,
    loadMore: srLoadMore, hasMore: srHasMore,
  } = useBookSearchInfinite(hasQuery ? debounced : null, 20);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  }, []);

  const pageBg  = isDark ? '#0f0d09' : '#faf6ef';
  const cardBg  = isDark ? '#171208' : '#fffdf6';
  const textP   = isDark ? '#f0e8d8' : '#1a1208';
  const textF   = isDark ? '#4a3e2a' : '#c0b0a0';
  const amber   = isDark ? '#e8a840' : '#c47a1e';
  const border  = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';
  const inputBg = isDark ? '#171208' : '#fffdf6';

  return (
    <div ref={pageRef} style={{ minHeight: '100dvh', background: pageBg, fontFamily: 'Gilroy, sans-serif' }}>

      {/* Ambient glow blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '60vw', height: '60vw',
          borderRadius: '50%', background: isDark
            ? 'radial-gradient(circle, rgba(196,122,30,0.06) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(196,122,30,0.09) 0%, transparent 65%)' }}/>
        <div style={{ position: 'absolute', bottom: '5%', left: '-20%', width: '50vw', height: '50vw',
          borderRadius: '50%', background: isDark
            ? 'radial-gradient(circle, rgba(196,122,30,0.035) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(196,122,30,0.05) 0%, transparent 65%)' }}/>
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto',
        padding: '52px 18px 100px' }}>

        {/* ── PAGE TITLE ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12,
            background: isDark ? 'rgba(196,122,30,0.12)' : 'rgba(196,122,30,0.1)',
            border: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={16} color={amber}/>
          </div>
          <div>
            <h1 style={{ fontSize: '1.22rem', fontWeight: 800, color: textP,
              fontFamily: 'Gilroy, sans-serif', letterSpacing: '-0.025em', margin: 0 }}>
              Explore
            </h1>
            <p style={{ fontSize: '0.65rem', color: textF,
              fontFamily: 'Gilroy, sans-serif', margin: 0 }}>
              Books, authors & genres
            </p>
          </div>
        </motion.div>

        {/* ── SEARCH BAR ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ position: 'relative', marginBottom: 28 }}>
          <motion.div animate={{ scale: focused ? 1.01 : 1 }} transition={{ duration: 0.2 }}>
            <Search size={15} color={query ? amber : textF}
              style={{ position: 'absolute', left: 16, top: '50%',
                transform: 'translateY(-50%)', zIndex: 2 }}/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => !query && setFocused(false)}
              placeholder="Search books, authors, genres…"
              style={{ width: '100%', padding: '14px 44px 14px 42px', borderRadius: 18,
                outline: 'none', background: inputBg,
                border: `1.5px solid ${query ? amber + '70' : border}`,
                color: textP, fontFamily: 'Gilroy, sans-serif', fontSize: '0.9rem',
                boxShadow: query
                  ? `0 0 0 4px rgba(196,122,30,0.08), 0 4px 24px rgba(0,0,0,0.12)`
                  : `0 2px 16px rgba(0,0,0,0.07)`,
                transition: 'all 0.25s ease' }}/>
            <AnimatePresence>
              {query && (
                <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => { setQuery(''); setFocused(false); }}
                  style={{ position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)', background: isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)',
                    border: 'none', cursor: 'pointer', display: 'flex',
                    color: textF, borderRadius: 8, padding: 4 }}>
                  <X size={14}/>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* ── CONTENT ── */}
        <AnimatePresence mode="wait">

          {/* SEARCH STATE */}
          {hasQuery ? (
            <motion.div key="search"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <SearchResults
                books={srBooks} authors={srAuthors}
                loading={srLoading} query={debounced}
                hasMoreBooks={srHasMore}
                loadingMoreBooks={srLoadingMore}
                onLoadMoreBooks={srLoadMore}
              />
            </motion.div>

          ) : (

            /* DEFAULT STATE */
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* Featured Authors */}
              <section style={{ marginBottom: 32 }}>
                <SectionHeader
                  label="Featured Authors"
                  icon={<Users size={14} color={isDark ? '#4a3e2a' : '#c0b0a0'}/>}
                  onViewAll={() => setShowAllAuthors(true)}
                  isDark={isDark}/>
                <AuthorsRow isDark={isDark} onSelectAuthor={setSelectedAuthor}/>
              </section>

              {/* Trending Books */}
              <section style={{ marginBottom: 32 }}>
                <SectionHeader
                  label="Trending Books"
                  icon={<TrendingUp size={14} color={isDark ? '#4a3e2a' : '#c0b0a0'}/>}
                  isDark={isDark}/>
                <TrendingRow isDark={isDark} onSelectBook={setSelectedBook}/>
              </section>

              {/* Browse by Genre */}
              <section>
                <SectionHeader
                  label="Browse by Genre"
                  icon={<Grid size={14} color={isDark ? '#4a3e2a' : '#c0b0a0'}/>}
                  isDark={isDark}/>
                <CategoryGrid isDark={isDark} onSelectCat={setSelectedCat}/>
              </section>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav active="explore"/>

      {/* ── OVERLAYS — all slide in from right ── */}
      <AnimatePresence>
        {showAllAuthors && (
          <AllAuthorsPage key="all-authors" onBack={() => setShowAllAuthors(false)}/>
        )}
        {selectedAuthor && !showAllAuthors && (
          <AuthorDetailPage key={selectedAuthor.key}
            author={selectedAuthor} onBack={() => setSelectedAuthor(null)}/>
        )}
        {selectedCat && (
          <CategoryPage key={selectedCat.subject}
            cat={selectedCat} onBack={() => setSelectedCat(null)}/>
        )}
        {selectedBook && (
          <BookDetailPage key={selectedBook.key ?? selectedBook.title}
            book={selectedBook} onBack={() => setSelectedBook(null)}/>
        )}
      </AnimatePresence>

      <style>{`
        html, body { background: ${pageBg} !important; margin: 0; padding: 0; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        input::placeholder { color: ${textF}; opacity: 1; }
      `}</style>
    </div>
  );
}