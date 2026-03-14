// src/components/explore/SearchResults.jsx
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookCard, AuthorCard, Skeleton, Chip } from './ExploreUI';
import AuthorDetailPage from './AuthorDetailPage';
import BookDetailPage from './BookDetailPage';
import { useThemeStore } from '../../store/themeStore';

export default function SearchResults({ books, authors, loading, query,
  onLoadMoreBooks, hasMoreBooks, loadingMoreBooks }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [tab,          setTab]          = useState('books');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedAuth, setSelectedAuth] = useState(null);

  const textP  = isDark ? '#f0e8d8' : '#1a1208';
  const textM  = isDark ? '#7a6a52' : '#9a8a72';
  const textF  = isDark ? '#4a3e2a' : '#c0b0a0';
  const amber  = isDark ? '#e8a840' : '#c47a1e';
  const border = isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)';

  const observerRef = useRef(null);
  const sentinelRef = useCallback(node => {
    if (!node) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreBooks && !loadingMoreBooks && onLoadMoreBooks)
        onLoadMoreBooks();
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
  }, [hasMoreBooks, loadingMoreBooks, onLoadMoreBooks]);

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { id: 'books',   label: books.length   ? `Books (${books.length}+)`   : 'Books' },
          { id: 'authors', label: authors.length ? `Authors (${authors.length}+)` : 'Authors' },
        ].map(t => (
          <Chip key={t.id} label={t.label} active={tab === t.id}
            onClick={() => setTab(t.id)} isDark={isDark}/>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton w="100%" h={140} r={14} isDark={isDark}/>
                  <Skeleton w="80%" h={11} isDark={isDark}/>
                </div>
              ))}
            </div>
          </motion.div>

        ) : tab === 'books' ? (
          <motion.div key="books"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {books.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 14, opacity: 0.4 }}>🔍</div>
                <div style={{ fontSize: '0.9rem', color: textF,
                  fontFamily: 'Gilroy, sans-serif', fontWeight: 600 }}>
                  No books found for
                </div>
                <div style={{ fontSize: '1rem', color: textM,
                  fontFamily: 'Gilroy, sans-serif', fontWeight: 700, marginTop: 4 }}>
                  "{query}"
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {books.map((b, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.35) }}>
                      <BookCard book={b} onTap={setSelectedBook} isDark={isDark} width="100%"/>
                    </motion.div>
                  ))}
                </div>
                {hasMoreBooks && (
                  <div ref={sentinelRef} style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
                    {loadingMoreBooks && (
                      <motion.div animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 22, height: 22, borderRadius: '50%',
                          border: `2px solid ${border}`, borderTopColor: amber }}/>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>

        ) : (
          <motion.div key="authors"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {authors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 14, opacity: 0.4 }}>✍️</div>
                <div style={{ fontSize: '0.9rem', color: textF,
                  fontFamily: 'Gilroy, sans-serif', fontWeight: 600 }}>
                  No authors found for
                </div>
                <div style={{ fontSize: '1rem', color: textM,
                  fontFamily: 'Gilroy, sans-serif', fontWeight: 700, marginTop: 4 }}>
                  "{query}"
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {authors.map((a, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.35) }}>
                    <AuthorCard
                      author={{ key: a.key, name: a.name, type: a.top_subjects?.[0], work_count: a.work_count }}
                      onTap={setSelectedAuth}
                      isDark={isDark}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBook && (
          <BookDetailPage key={selectedBook.key ?? selectedBook.title}
            book={selectedBook} onBack={() => setSelectedBook(null)}/>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedAuth && (
          <AuthorDetailPage key={selectedAuth.key}
            author={selectedAuth} onBack={() => setSelectedAuth(null)}/>
        )}
      </AnimatePresence>
    </>
  );
}