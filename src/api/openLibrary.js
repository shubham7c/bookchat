// src/api/openLibrary.js
const OL_BASE = 'https://openlibrary.org';
const COVERS  = 'https://covers.openlibrary.org';

const cache    = new Map();
const inflight = new Map();

function cached(key, ttlMs, fetcher) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data);
  if (inflight.has(key)) return inflight.get(key);
  const p = fetcher()
    .then(data => { cache.set(key, { data, ts: Date.now() }); inflight.delete(key); return data; })
    .catch(e   => { inflight.delete(key); throw e; });
  inflight.set(key, p);
  return p;
}

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export const coverUrl  = (id,  size = 'M') => `${COVERS}/b/id/${id}-${size}.jpg`;
export const authorImg = (key, size = 'M') => `${COVERS}/a/olid/${key}-${size}.jpg`;

const BOOK_FIELDS = 'key,title,author_name,author_key,cover_i,first_publish_year,ratings_average';

// paginated — offset lets you load more
export function searchBooks(q, limit = 20, offset = 0) {
  return cached(`sb:${q}:${limit}:${offset}`, 5 * 60_000, () =>
    get(`${OL_BASE}/search.json?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&fields=${BOOK_FIELDS}`)
      .then(d => ({ docs: (d.docs||[]).filter(b=>b.cover_i), numFound: d.numFound||0 }))
  );
}

export function searchAuthors(q, limit = 20, offset = 0) {
  return cached(`sa:${q}:${limit}:${offset}`, 5 * 60_000, () =>
    get(`${OL_BASE}/search/authors.json?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`)
      .then(d => ({ docs: d.docs||[], numFound: d.numFound||0 }))
  );
}

export function getAuthorDetail(olid) {
  return cached(`ad:${olid}`, 10 * 60_000, () => get(`${OL_BASE}/authors/${olid}.json`));
}

// OL supports up to 600 works per author
export function getAuthorWorks(olid, limit = 20, offset = 0) {
  return cached(`aw:${olid}:${limit}:${offset}`, 10 * 60_000, () =>
    get(`${OL_BASE}/authors/${olid}/works.json?limit=${limit}&offset=${offset}`)
      .then(d => ({ entries: d.entries||[], size: d.size||0 }))
  );
}

export function getCategoryBooks(subject, limit = 20, offset = 0) {
  const s = subject.toLowerCase().replace(/ /g, '_');
  return cached(`cat:${s}:${limit}:${offset}`, 10 * 60_000, () =>
    get(`${OL_BASE}/subjects/${encodeURIComponent(s)}.json?limit=${limit}&offset=${offset}`)
      .then(d => ({
        works: (d.works||[]).filter(w=>w.cover_id),
        workCount: d.work_count||0,
        name: d.name||subject,
      }))
  );
}

const TRENDING_Q = ['popular fiction 2024','bestseller thriller','award winning novels'];
export async function getTrendingBooks(limit = 12) {
  return cached(`trend:${limit}`, 10*60_000, async () => {
    const q = TRENDING_Q[Math.floor(Math.random()*TRENDING_Q.length)];
    const { docs } = await searchBooks(q, limit*2);
    const seen = new Set();
    return docs.filter(b=>{ if(seen.has(b.title)) return false; seen.add(b.title); return true; }).slice(0,limit);
  });
}

export const FEATURED_AUTHORS = [
  { key:'OL23919A',   name:'J.K. Rowling',       type:'Fantasy',     genre:'Fantasy'  },
  { key:'OL31574A',   name:'Stephen King',        type:'Horror',      genre:'Horror'   },
  { key:'OL18319A',   name:'Agatha Christie',     type:'Mystery',     genre:'Mystery'  },
  { key:'OL27349A',   name:'Neil Gaiman',         type:'Fantasy',     genre:'Fantasy'  },
  { key:'OL26320A',   name:'Paulo Coelho',        type:'Fiction',     genre:'Fiction'  },
  { key:'OL20629A',   name:'George Orwell',       type:'Classic',     genre:'Classic'  },
  { key:'OL4107502A', name:'Yuval Harari',        type:'Non-Fiction', genre:'History'  },
  { key:'OL234664A',  name:'F. Scott Fitzgerald', type:'Classic',     genre:'Classic'  },
  { key:'OL3964979A', name:'Toni Morrison',       type:'Literary',    genre:'Fiction'  },
  { key:'OL2622589A', name:'Haruki Murakami',     type:'Literary',    genre:'Fiction'  },
  { key:'OL6948A',    name:'Ernest Hemingway',    type:'Classic',     genre:'Classic'  },
  { key:'OL18528A',   name:'Virginia Woolf',      type:'Literary',    genre:'Literary' },
];

export const CATEGORIES = [
  { label:'Fantasy',    subject:'fantasy',         emoji:'🐉', color:'#6b3fa0' },
  { label:'Mystery',    subject:'mystery',         emoji:'🔍', color:'#4a3a2a' },
  { label:'Sci-Fi',     subject:'science_fiction', emoji:'🚀', color:'#1a6a9a' },
  { label:'Romance',    subject:'romance',         emoji:'🌹', color:'#a04060' },
  { label:'Biography',  subject:'biography',       emoji:'👤', color:'#3a5a3a' },
  { label:'History',    subject:'history',         emoji:'🏛️', color:'#7a5a20' },
  { label:'Horror',     subject:'horror',          emoji:'🌑', color:'#5a1a1a' },
  { label:'Philosophy', subject:'philosophy',      emoji:'🧠', color:'#4a4a7a' },
  { label:'Self-Help',  subject:'self-help',       emoji:'🌱', color:'#4a7a2a' },
  { label:'Classics',   subject:'classics',        emoji:'🏺', color:'#8b6914' },
  { label:'Thriller',   subject:'thriller',        emoji:'⚡', color:'#2a5a8a' },
  { label:'Poetry',     subject:'poetry',          emoji:'✒️', color:'#6a3a5a' },
];