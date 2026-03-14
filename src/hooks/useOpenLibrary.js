// src/hooks/useOpenLibrary.js
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  searchBooks, searchAuthors,
  getAuthorDetail, getAuthorWorks,
  getCategoryBooks, getTrendingBooks,
} from '../api/openLibrary';

// Basic single-fetch hook
function useFetch(fetcher, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    setLoading(true); setError(null);
    fetcher()
      .then(d  => { if (mounted.current) { setData(d);  setLoading(false); } })
      .catch(e => { if (mounted.current) { setError(e); setLoading(false); } });
    return () => { mounted.current = false; };
  }, deps); // eslint-disable-line
  return { data, loading, error };
}

// ─── INFINITE SCROLL hook ─────────────────────────────────────────────────────
// fetcher(offset) must return { items[], total }
export function useInfiniteList(fetcher, pageSize = 20, enabled = true) {
  const [items,      setItems]      = useState([]);
  const [total,      setTotal]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [loadingMore,setLoadingMore] = useState(false);
  const [offset,     setOffset]     = useState(0);
  const mounted = useRef(true);

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    mounted.current = true;
    setItems([]); setOffset(0); setTotal(null);
    setLoading(true);
    fetcher(0)
      .then(({ items: newItems, total: t }) => {
        if (!mounted.current) return;
        setItems(newItems);
        setTotal(t);
        setOffset(newItems.length);
        setLoading(false);
      })
      .catch(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [enabled]); // eslint-disable-line

  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;
    if (total !== null && offset >= total) return;
    setLoadingMore(true);
    fetcher(offset)
      .then(({ items: newItems }) => {
        if (!mounted.current) return;
        setItems(prev => [...prev, ...newItems]);
        setOffset(prev => prev + newItems.length);
        setLoadingMore(false);
      })
      .catch(() => { if (mounted.current) setLoadingMore(false); });
  }, [offset, total, loading, loadingMore, fetcher]);

  const hasMore = total === null || offset < total;

  return { items, loading, loadingMore, loadMore, hasMore, total };
}

// ─── AUTHOR DETAIL ────────────────────────────────────────────────────────────
export function useAuthorDetail(olid) {
  return useFetch(() => olid ? getAuthorDetail(olid) : Promise.resolve(null), [olid]);
}

// Author works — infinite
export function useAuthorWorksInfinite(olid, pageSize = 20) {
  const fetcher = useCallback(async (offset) => {
    if (!olid) return { items: [], total: 0 };
    const { entries, size } = await getAuthorWorks(olid, pageSize, offset);
    return { items: entries, total: size };
  }, [olid, pageSize]);
  return useInfiniteList(fetcher, pageSize, !!olid);
}

// ─── CATEGORY BOOKS — infinite ────────────────────────────────────────────────
export function useCategoryBooksInfinite(subject, pageSize = 20) {
  const [categoryInfo, setCategoryInfo] = useState(null);
  const fetcher = useCallback(async (offset) => {
    if (!subject) return { items: [], total: 0 };
    const { works, workCount, name } = await getCategoryBooks(subject, pageSize, offset);
    if (offset === 0) setCategoryInfo({ name, workCount });
    return { items: works, total: workCount };
  }, [subject, pageSize]);
  const result = useInfiniteList(fetcher, pageSize, !!subject);
  return { ...result, categoryInfo };
}

// ─── SEARCH — books infinite ──────────────────────────────────────────────────
export function useBookSearchInfinite(query, pageSize = 20) {
  const fetcher = useCallback(async (offset) => {
    if (!query || query.length < 2) return { items: [], total: 0 };
    const { docs, numFound } = await searchBooks(query, pageSize, offset);
    return { items: docs, total: numFound };
  }, [query, pageSize]);
  return useInfiniteList(fetcher, pageSize, query?.length >= 2);
}

// ─── SEARCH — authors infinite ────────────────────────────────────────────────
export function useAuthorSearchInfinite(query, pageSize = 20) {
  const fetcher = useCallback(async (offset) => {
    if (!query || query.length < 2) return { items: [], total: 0 };
    const { docs, numFound } = await searchAuthors(query, pageSize, offset);
    return { items: docs, total: numFound };
  }, [query, pageSize]);
  return useInfiniteList(fetcher, pageSize, query?.length >= 2);
}

// ─── TRENDING ─────────────────────────────────────────────────────────────────
export function useTrendingBooks(limit = 12) {
  return useFetch(() => getTrendingBooks(limit), [limit]);
}

// ─── DEBOUNCED COMBINED SEARCH ────────────────────────────────────────────────
export function useDebouncedSearch(query, delay = 450) {
  const [debounced, setDebounced] = useState('');
  const [books,     setBooks]     = useState([]);
  const [authors,   setAuthors]   = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), delay);
    return () => clearTimeout(t);
  }, [query, delay]);

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setBooks([]); setAuthors([]); setLoading(false); return;
    }
    setLoading(true);
    Promise.all([
      searchBooks(debounced, 12, 0),
      searchAuthors(debounced, 6, 0),
    ]).then(([b, a]) => {
      setBooks(b.docs); setAuthors(a.docs); setLoading(false);
    }).catch(() => setLoading(false));
  }, [debounced]);

  return { books, authors, loading, hasQuery: debounced.length >= 2, debounced };
}