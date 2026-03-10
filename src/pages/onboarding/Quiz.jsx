import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { ArrowRight, ArrowLeft, Camera, X, Check, Sparkles } from 'lucide-react';

// ─── ALL QUESTIONS ─────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'photo',
    type: 'photo',
    title: 'Add a profile photo',
    subtitle: 'Put a face to your bookmarks — you can always change it later',
  },
  {
    id: 'genres',
    type: 'multi', max: 6,
    title: 'What genres speak to your soul?',
    subtitle: 'Pick up to 6 — shapes your entire feed',
    options: [
      { value: 'literary-fiction',  label: 'Literary Fiction',    icon: '📖', color: '#8b6914' },
      { value: 'fantasy',           label: 'Fantasy',             icon: '🐉', color: '#6b4fa0' },
      { value: 'sci-fi',            label: 'Science Fiction',     icon: '🚀', color: '#2a6a9a' },
      { value: 'mystery',           label: 'Mystery & Thriller',  icon: '🔍', color: '#4a3a2a' },
      { value: 'romance',           label: 'Romance',             icon: '🌹', color: '#a04060' },
      { value: 'non-fiction',       label: 'Non-Fiction',         icon: '📚', color: '#2a6a4a' },
      { value: 'history',           label: 'History',             icon: '🏛️', color: '#7a5a20' },
      { value: 'philosophy',        label: 'Philosophy',          icon: '🧠', color: '#4a4a7a' },
      { value: 'poetry',            label: 'Poetry',              icon: '✒️', color: '#6a3a5a' },
      { value: 'biography',         label: 'Biography / Memoir',  icon: '👤', color: '#3a5a3a' },
      { value: 'self-help',         label: 'Self-Help',           icon: '🌱', color: '#4a7a2a' },
      { value: 'horror',            label: 'Horror',              icon: '🌑', color: '#3a1a1a' },
      { value: 'classics',          label: 'Classics',            icon: '🏺', color: '#7a6020' },
      { value: 'graphic-novels',    label: 'Graphic Novels',      icon: '🎨', color: '#5a2a7a' },
      { value: 'young-adult',       label: 'Young Adult',         icon: '⚡', color: '#3a6a9a' },
      { value: 'true-crime',        label: 'True Crime',          icon: '🕵️', color: '#5a2a2a' },
      { value: 'science',           label: 'Science & Nature',    icon: '🔬', color: '#2a5a6a' },
      { value: 'spirituality',      label: 'Spirituality',        icon: '✨', color: '#7a4a60' },
      { value: 'travel',            label: 'Travel & Adventure',  icon: '🌍', color: '#2a7a4a' },
      { value: 'art-photography',   label: 'Art & Photography',   icon: '🖼️', color: '#6a4a2a' },
      { value: 'business',          label: 'Business & Finance',  icon: '📊', color: '#2a4a6a' },
      { value: 'cooking',           label: 'Food & Cooking',      icon: '🍳', color: '#8a5020' },
      { value: 'health',            label: 'Health & Wellness',   icon: '💚', color: '#2a6a3a' },
      { value: 'comics-manga',      label: 'Comics & Manga',      icon: '💥', color: '#9a3a2a' },
    ],
  },
  {
    id: 'reading_vibe',
    type: 'single',
    title: 'What draws you most to a book?',
    subtitle: 'Your reading personality — influences what sparks appear first',
    options: [
      { value: 'escape',    label: 'Pure escape',       icon: '🌊', desc: 'Lose myself in another world' },
      { value: 'knowledge', label: 'Learn & grow',      icon: '🧠', desc: 'Expand my mind'               },
      { value: 'emotion',   label: 'Feel deeply',       icon: '💫', desc: 'Books that move me'           },
      { value: 'story',     label: 'Great storytelling',icon: '✨', desc: 'Craft, narrative, voice'      },
      { value: 'ideas',     label: 'Big ideas',         icon: '💡', desc: 'Philosophy & theory'          },
      { value: 'beauty',    label: 'Beautiful writing', icon: '🌸', desc: 'Prose as art'                 },
    ],
  },
  {
    id: 'discover_how',
    type: 'multi', max: 3,
    title: 'How do you discover books?',
    subtitle: 'Pick up to 3 — we\'ll surface more of what you love',
    options: [
      { value: 'friends',     label: 'Friends & community', icon: '👥', color: '#c47a1e' },
      { value: 'social',      label: 'Social media',        icon: '📱', color: '#6b4fa0' },
      { value: 'bookshops',   label: 'Browsing bookshops',  icon: '🏪', color: '#2a6a4a' },
      { value: 'lists',       label: 'Best-of lists',       icon: '📋', color: '#2a6a9a' },
      { value: 'reviews',     label: 'Reviews & critics',   icon: '📝', color: '#7a5a20' },
      { value: 'awards',      label: 'Award winners',       icon: '🏆', color: '#a04060' },
      { value: 'author',      label: 'Following authors',   icon: '✒️', color: '#4a4a7a' },
      { value: 'algorithm',   label: 'Recommendations',     icon: '⚡', color: '#3a6a9a' },
    ],
  },
  {
    id: 'reading_pace',
    type: 'single',
    title: 'Your reading pace?',
    subtitle: 'No judgment — helps us calibrate your feed',
    options: [
      { value: 'slow-deep',  label: 'Slow & deep',      icon: '🐢', desc: 'Every word, every nuance'  },
      { value: 'balanced',   label: 'It depends',       icon: '⚖️', desc: 'Mood & book-dependent'     },
      { value: 'fast',       label: 'Fast devourer',    icon: '⚡', desc: 'I blaze through books'      },
      { value: 'audiobook',  label: 'Audiobook lover',  icon: '🎧', desc: 'I listen more than I read' },
      { value: 'occasional', label: 'Occasional reader',icon: '🌿', desc: 'When the moment is right'  },
    ],
  },
  {
    id: 'writing_does',
    type: 'single',
    title: 'Do you write?',
    subtitle: 'This helps us show you the right writer community',
    options: [
      { value: 'yes-active',   label: 'Yes, actively',       icon: '✍️', desc: 'Writing is my craft'         },
      { value: 'yes-casual',   label: 'Casually / sometimes', icon: '📝', desc: 'When inspiration strikes'    },
      { value: 'exploring',    label: 'Thinking about it',   icon: '🔍', desc: 'Still exploring'             },
      { value: 'reader-only',  label: 'Pure reader',         icon: '📖', desc: 'I\'m here for the books'     },
    ],
  },
  {
    id: 'writing_types',
    type: 'multi', max: 3,
    skip_if: (ans) => ans.writing_does === 'reader-only',
    title: 'What do you write?',
    subtitle: 'Pick up to 3 — your creative territory',
    options: [
      { value: 'fiction',       label: 'Fiction',         icon: '📖', color: '#8b6914' },
      { value: 'poetry',        label: 'Poetry',          icon: '✒️', color: '#6a3a5a' },
      { value: 'non-fiction',   label: 'Non-Fiction',     icon: '📝', color: '#2a6a4a' },
      { value: 'short-stories', label: 'Short Stories',   icon: '📃', color: '#7a4a20' },
      { value: 'essays',        label: 'Essays',          icon: '🖊️', color: '#4a4a7a' },
      { value: 'screenwriting', label: 'Screenwriting',   icon: '🎬', color: '#2a4a7a' },
      { value: 'fan-fiction',   label: 'Fan Fiction',     icon: '🌟', color: '#7a3a4a' },
      { value: 'experimental',  label: 'Experimental',    icon: '🔬', color: '#3a6a6a' },
      { value: 'journalism',    label: 'Journalism',      icon: '📰', color: '#3a4a6a' },
      { value: 'blog',          label: 'Blog / Content',  icon: '💻', color: '#2a5a4a' },
    ],
  },
  {
    id: 'feed_vibe',
    type: 'single',
    title: 'What\'s your ideal BookChat feed?',
    subtitle: 'Sets the tone for everything you see',
    options: [
      { value: 'deep-dive',   label: 'Deep & thoughtful',  icon: '🌊', desc: 'Long sparks, analysis, essays' },
      { value: 'quick-hits',  label: 'Quick & punchy',     icon: '⚡', desc: 'Short, sharp takes on books'   },
      { value: 'discovery',   label: 'Discover new books', icon: '🔭', desc: 'Recommendations & reviews'     },
      { value: 'creative',    label: 'Writer excerpts',    icon: '✒️', desc: 'Original writing & poetry'     },
      { value: 'social',      label: 'Community & chat',   label2: 'Community', icon: '👥', desc: 'What friends are reading'      },
    ],
  },
  {
    id: 'privacy',
    type: 'single',
    title: 'Who can see your activity?',
    subtitle: 'You can change this anytime in Settings',
    options: [
      { value: 'public',     label: 'Everyone',          icon: '🌍', desc: 'Open to all BookChat members' },
      { value: 'followers',  label: 'Followers only',    icon: '👥', desc: 'Only people who follow you'   },
      { value: 'private',    label: 'Just me',           icon: '🔒', desc: 'Keep it private for now'      },
    ],
  },
];

// ─── BACKGROUND ───────────────────────────────────────────────────────────────

function Bg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#faf6ef' }}/>
      <motion.div animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,122,30,0.07) 0%,transparent 65%)' }}/>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(196,122,30,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(196,122,30,0.025) 1px,transparent 1px)', backgroundSize: '52px 52px' }}/>
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

function Progress({ current, total }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#c47a1e', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif' }}>
          Step {current + 1} of {total}
        </span>
        <span style={{ fontSize: '0.62rem', color: '#b0a090', fontFamily: 'Gilroy, sans-serif' }}>
          {Math.round(((current + 1) / total) * 100)}% complete
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(196,122,30,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${((current + 1) / total) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#c47a1e,#e8a840)' }}/>
      </div>
    </div>
  );
}

// ─── PHOTO STEP ───────────────────────────────────────────────────────────────

function PhotoStep({ value, onChange }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(value || null);

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange({ file, url });
  };

  const remove = () => { setPreview(null); onChange(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '10px 0 20px' }}>
      <motion.div
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        onClick={() => fileRef.current?.click()}
        style={{
          width: 130, height: 130, borderRadius: '50%', position: 'relative', cursor: 'pointer',
          background: preview ? 'transparent' : 'linear-gradient(145deg,rgba(196,122,30,0.1),rgba(196,122,30,0.05))',
          border: `2.5px dashed ${preview ? 'rgba(196,122,30,0.4)' : 'rgba(196,122,30,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: preview ? '0 8px 32px rgba(196,122,30,0.2)' : '0 4px 16px rgba(0,0,0,0.04)',
          transition: 'all 0.3s',
        }}>
        {preview
          ? <img src={typeof preview === 'string' ? preview : preview.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}/>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(196,122,30,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={20} color="#c47a1e" strokeWidth={1.8}/>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#c47a1e', fontWeight: 700, fontFamily: 'Gilroy, sans-serif', letterSpacing: '0.04em' }}>Add Photo</span>
            </div>
          )
        }
        {/* Hover overlay */}
        {preview && (
          <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={22} color="#fff" strokeWidth={1.8}/>
          </motion.div>
        )}
      </motion.div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }}/>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => fileRef.current?.click()}
          style={{ padding: '10px 20px', borderRadius: 50, border: '1.5px solid rgba(196,122,30,0.3)', background: 'transparent', color: '#c47a1e', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'Gilroy, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}>
          {preview ? 'Change Photo' : 'Upload Photo'}
        </motion.button>
        {preview && (
          <motion.button type="button" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={remove}
            style={{ padding: '10px 18px', borderRadius: 50, border: '1.5px solid rgba(180,80,60,0.3)', background: 'transparent', color: '#b05040', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'Gilroy, sans-serif', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5 }}>
            <X size={13}/> Remove
          </motion.button>
        )}
      </div>

      <p style={{ fontSize: '0.72rem', color: '#b0a090', textAlign: 'center', fontFamily: 'Gilroy, sans-serif', maxWidth: 260, lineHeight: 1.5 }}>
        Profiles with a photo get 3× more connections. But no pressure!
      </p>
    </div>
  );
}

// ─── CHOICE OPTION ────────────────────────────────────────────────────────────

function ChoiceCard({ opt, selected, onClick, multi }) {
  const isOn = selected;
  return (
    <motion.button type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 13,
        padding: '13px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
        background: isOn
          ? `linear-gradient(135deg,${opt.color || '#c47a1e'}14,${opt.color || '#c47a1e'}06)`
          : 'rgba(245,240,232,0.7)',
        border: `1.5px solid ${isOn ? (opt.color || '#c47a1e') + '50' : 'rgba(196,122,30,0.1)'}`,
        boxShadow: isOn ? `0 4px 16px ${opt.color || '#c47a1e'}18` : '0 1px 4px rgba(0,0,0,0.03)',
        transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}>
      <AnimatePresence>
        {isOn && (
          <motion.div key="shine" initial={{ x: '-100%' }} animate={{ x: '200%' }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)', pointerEvents: 'none' }}/>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div style={{ width: 38, height: 38, borderRadius: 11, background: isOn ? `${opt.color || '#c47a1e'}18` : 'rgba(196,122,30,0.07)', border: `1px solid ${isOn ? (opt.color || '#c47a1e') + '30' : 'rgba(196,122,30,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, transition: 'all 0.2s' }}>
        {opt.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.87rem', fontWeight: isOn ? 700 : 500, color: isOn ? '#1a1208' : '#3a2e20', fontFamily: 'Gilroy, sans-serif', transition: 'all 0.15s' }}>
          {opt.label}
        </div>
        {opt.desc && (
          <div style={{ fontSize: '0.68rem', color: isOn ? '#6a5030' : '#9a8870', marginTop: 1, fontFamily: 'Gilroy, sans-serif' }}>
            {opt.desc}
          </div>
        )}
      </div>

      {/* Checkmark */}
      <motion.div
        animate={{ scale: isOn ? 1 : 0.7, opacity: isOn ? 1 : 0 }}
        style={{ width: 22, height: 22, borderRadius: 7, background: opt.color || '#c47a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
        <Check size={12} color="#fff" strokeWidth={3}/>
      </motion.div>
    </motion.button>
  );
}

// ─── GENRE CHIP ───────────────────────────────────────────────────────────────

function GenreChip({ opt, selected, onClick }) {
  return (
    <motion.button type="button" onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 13px', borderRadius: 50, cursor: 'pointer',
        background: selected
          ? `linear-gradient(135deg,${opt.color}22,${opt.color}12)`
          : 'rgba(245,240,232,0.8)',
        border: `1.5px solid ${selected ? opt.color + '55' : 'rgba(196,122,30,0.12)'}`,
        boxShadow: selected ? `0 3px 12px ${opt.color}22` : 'none',
        transition: 'all 0.2s',
      }}>
      <span style={{ fontSize: '0.95rem' }}>{opt.icon}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: selected ? 700 : 500, color: selected ? '#1a1208' : '#4a3a28', fontFamily: 'Gilroy, sans-serif', whiteSpace: 'nowrap' }}>
        {opt.label}
      </span>
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ width: 14, height: 14, borderRadius: '50%', background: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={8} color="#fff" strokeWidth={3}/>
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── QUIZ PAGE ─────────────────────────────────────────────────────────────────

export default function Quiz() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();
  const pageRef   = useRef(null);
  const cardRef   = useRef(null);

  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState({});
  const [photo, setPhoto]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  // Filter out skip_if questions
  const visibleQs = QUESTIONS.filter(q => !q.skip_if || !q.skip_if(answers));
  const current   = visibleQs[idx];
  const isLast    = idx === visibleQs.length - 1;

  useEffect(() => {
    if (pageRef.current) gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }, []);

  const animCard = dir => {
    gsap.fromTo(cardRef.current, { x: dir * 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.38, ease: 'power2.out' });
  };

  const canProceed = () => {
    if (!current) return false;
    if (current.type === 'photo') return true; // always skippable
    const ans = answers[current.id];
    if (current.type === 'single') return !!ans;
    if (current.type === 'multi')  return ans && ans.length > 0;
    return true;
  };

  const next = () => {
    if (!canProceed() && current?.type !== 'photo') return;
    // Recompute visibleQs fresh to avoid stale closure bug
    const freshVisible = QUESTIONS.filter(q => !q.skip_if || !q.skip_if(answers));
    const freshIsLast  = idx === freshVisible.length - 1;
    if (freshIsLast) { handleFinish(); return; }
    setIdx(p => p + 1);
    animCard(1);
  };

  const back = () => {
    if (idx === 0) return;
    setIdx(p => p - 1);
    animCard(-1);
  };

  const toggleMulti = (qid, val, max) => {
    setAnswers(p => {
      const cur = p[qid] || [];
      if (cur.includes(val)) return { ...p, [qid]: cur.filter(v => v !== val) };
      if (cur.length >= max) return p;
      return { ...p, [qid]: [...cur, val] };
    });
  };

  const setSingle = (qid, val) => {
    setAnswers(p => ({ ...p, [qid]: val }));
  };

  const handleFinish = async () => {
    setSaving(true);
    const uid = user?.uid || auth.currentUser?.uid;
    try {
      const payload = {
        genres:             answers.genres        || [],
        readingVibe:        answers.reading_vibe  || null,
        discoverHow:        answers.discover_how  || [],
        readingPace:        answers.reading_pace  || null,
        writingDoes:        answers.writing_does  || null,
        writingTypes:       answers.writing_types || [],
        feedVibe:           answers.feed_vibe     || null,
        privacyMode:        answers.privacy       || 'public',
        photoURL:           photo?.url            || '',
        onboardingComplete: true,
        updatedAt:          Date.now(),
      };
      if (uid) await updateDoc(doc(db, 'users', uid), payload);
    } catch (e) {
      console.error('Quiz save error:', e);
    }
    // Always navigate — never get stuck even if Firestore fails
    setDone(true);
    setTimeout(() => {
      try { navigate('/home'); }
      catch { window.location.href = '/home'; }
    }, 950);
  };

  // ── Render question content ─────────────────────────────────────
  const renderContent = () => {
    if (!current) return null;

    if (current.type === 'photo') {
      return <PhotoStep value={photo} onChange={setPhoto}/>;
    }

    if (current.id === 'genres') {
      const sel = answers.genres || [];
      return (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {current.options.map(opt => (
              <GenreChip key={opt.value} opt={opt}
                selected={sel.includes(opt.value)}
                onClick={() => toggleMulti(current.id, opt.value, current.max)}/>
            ))}
          </div>
          <p style={{ fontSize: '0.69rem', color: '#b0a090', textAlign: 'center', fontFamily: 'Gilroy, sans-serif' }}>
            {sel.length}/{current.max} selected
          </p>
        </div>
      );
    }

    if (current.type === 'multi') {
      const sel = answers[current.id] || [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {current.options.map(opt => (
            <ChoiceCard key={opt.value} opt={opt} multi
              selected={sel.includes(opt.value)}
              onClick={() => toggleMulti(current.id, opt.value, current.max)}/>
          ))}
          <p style={{ fontSize: '0.69rem', color: '#b0a090', textAlign: 'center', fontFamily: 'Gilroy, sans-serif', marginTop: 4 }}>
            {sel.length}/{current.max} selected
          </p>
        </div>
      );
    }

    if (current.type === 'single') {
      const sel = answers[current.id];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {current.options.map(opt => (
            <ChoiceCard key={opt.value} opt={opt}
              selected={sel === opt.value}
              onClick={() => setSingle(current.id, opt.value)}/>
          ))}
        </div>
      );
    }
  };

  // ── Done screen ─────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf6ef', position: 'relative' }}>
      <Bg/>
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.12, 1] }} transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{ fontSize: '4rem', marginBottom: 16 }}>📚</motion.div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1208', letterSpacing: '-0.025em', fontFamily: 'Gilroy, sans-serif', marginBottom: 8 }}>
          Your shelf is ready!
        </h2>
        <p style={{ color: '#8a7560', fontSize: '0.85rem', fontFamily: 'Gilroy, sans-serif' }}>
          Taking you to your feed…
        </p>
        {/* Sparkle dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            style={{ position: 'absolute', fontSize: '1rem', color: '#c47a1e', left: `${15 + i * 14}%`, top: '-10px' }}>
            ✦
          </motion.div>
        ))}
      </motion.div>
    </div>
  );

  return (
    <div ref={pageRef} style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1.25rem 2rem', position: 'relative', overflow: 'hidden' }}>
      <Bg/>

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 50, background: 'rgba(196,122,30,0.08)', border: '1px solid rgba(196,122,30,0.16)', marginBottom: 10 }}>
            <Sparkles size={12} color="#c47a1e" strokeWidth={2}/>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#c47a1e', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif' }}>
              Personalizing Your Feed
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.2rem,4vw,1.45rem)', fontWeight: 800, color: '#1a1208', letterSpacing: '-0.02em', lineHeight: 1.15, fontFamily: 'Gilroy, sans-serif' }}>
            Let's set up your BookChat
          </h1>
          <p style={{ color: '#9a8870', fontSize: '0.8rem', marginTop: 4, fontFamily: 'Gilroy, sans-serif' }}>
            Takes about 2 minutes
          </p>
        </div>

        {/* Card */}
        <div ref={cardRef} style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(196,122,30,0.1)', borderRadius: 22, padding: 'clamp(1.3rem,5vw,2rem)', boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 4px 14px rgba(196,122,30,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(196,122,30,0.2),transparent)' }}/>

          <Progress current={idx} total={visibleQs.length}/>

          <AnimatePresence mode="wait">
            <motion.div key={current?.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>

              {/* Question header */}
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: 'clamp(1rem,3.5vw,1.15rem)', fontWeight: 800, color: '#1a1208', letterSpacing: '-0.02em', lineHeight: 1.25, fontFamily: 'Gilroy, sans-serif', marginBottom: 5 }}>
                  {current?.title}
                </h2>
                {current?.subtitle && (
                  <p style={{ fontSize: '0.76rem', color: '#9a8870', fontFamily: 'Gilroy, sans-serif', lineHeight: 1.5 }}>
                    {current.subtitle}
                  </p>
                )}
              </div>

              {/* Content */}
              <div style={{ maxHeight: '52vh', overflowY: 'auto', paddingRight: 2, scrollbarWidth: 'none' }}>
                {renderContent()}
              </div>
            </motion.div>
          </AnimatePresence>

          <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(196,122,30,0.12),transparent)' }}/>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
          {/* Back */}
          {idx > 0 && (
            <motion.button type="button" onClick={back} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(196,122,30,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <ArrowLeft size={18} color="#8a7060" strokeWidth={2}/>
            </motion.button>
          )}

          {/* Skip (photo step only) */}
          {current?.type === 'photo' && (
            <motion.button type="button" onClick={next} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ flex: 1, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(196,122,30,0.12)', fontFamily: 'Gilroy, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: '#9a8070', cursor: 'pointer' }}>
              Skip for now
            </motion.button>
          )}

          {/* Next / Finish */}
          <motion.button type="button" onClick={next}
            disabled={!canProceed() && current?.type !== 'photo'}
            whileHover={canProceed() ? { scale: 1.02 } : {}}
            whileTap={canProceed() ? { scale: 0.97 } : {}}
            style={{
              flex: current?.type === 'photo' ? 'none' : 1,
              width: current?.type === 'photo' ? 48 : 'auto',
              height: 48, borderRadius: 14,
              background: canProceed()
                ? 'linear-gradient(135deg,#7a4800,#b87018,#d49030,#e8a840)'
                : 'rgba(196,122,30,0.12)',
              border: `1px solid ${canProceed() ? 'rgba(196,122,30,0.2)' : 'rgba(196,122,30,0.1)'}`,
              color: canProceed() ? '#fdf0e0' : '#c0b090',
              fontFamily: 'Gilroy, sans-serif', fontSize: '0.9rem', fontWeight: 700,
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              letterSpacing: '0.03em',
              boxShadow: canProceed() ? '0 6px 24px rgba(196,122,30,0.28), inset 0 1px 0 rgba(255,255,255,0.14)' : 'none',
              transition: 'all 0.25s',
              position: 'relative', overflow: 'hidden',
            }}>
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⏳</motion.span>
                  Saving…
                </motion.span>
              ) : isLast ? (
                <motion.span key="finish" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {current?.type === 'photo' && photo ? '✓' : isLast ? '🚀 Enter BookChat' : <ArrowRight size={18} strokeWidth={2.5}/>}
                </motion.span>
              ) : current?.type === 'photo' ? (
                <motion.span key="photonext" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {photo ? <Check size={18} strokeWidth={2.5}/> : <ArrowRight size={18} strokeWidth={2.5}/>}
                </motion.span>
              ) : (
                <motion.span key="next" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {isLast ? '🚀 Enter BookChat' : <>Next <ArrowRight size={15} strokeWidth={2.5}/></>}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Dots nav */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {visibleQs.map((_, i) => (
            <motion.div key={i}
              animate={{ width: i === idx ? 20 : 6, background: i === idx ? '#c47a1e' : i < idx ? 'rgba(196,122,30,0.35)' : 'rgba(196,122,30,0.15)' }}
              style={{ height: 6, borderRadius: 3 }}/>
          ))}
        </div>

      </div>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}