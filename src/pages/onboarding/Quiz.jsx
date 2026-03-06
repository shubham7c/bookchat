import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import {
  BookOpen, PenLine, Library, ArrowRight, ArrowLeft,
  Sparkles, Moon, Sun, Coffee, Zap, Heart, Brain,
  Clock, Globe, Feather, BookMarked, Users, Star
} from 'lucide-react';

// ── Question Bank ────────────────────────────────────────────────
// Shown to ALL users
const COMMON_QUESTIONS = [
  {
    id: 'genres',
    title: 'What genres speak to your soul?',
    subtitle: 'Pick all that resonate with you',
    type: 'multi',
    max: 5,
    options: [
      { value: 'literary-fiction',  label: 'Literary Fiction',  icon: '📖', color: '#8b6914' },
      { value: 'fantasy',           label: 'Fantasy',           icon: '🐉', color: '#6b4fa0' },
      { value: 'sci-fi',            label: 'Science Fiction',   icon: '🚀', color: '#2a6a9a' },
      { value: 'mystery',           label: 'Mystery & Thriller',icon: '🔍', color: '#4a3a2a' },
      { value: 'romance',           label: 'Romance',           icon: '🌹', color: '#a04060' },
      { value: 'non-fiction',       label: 'Non-Fiction',       icon: '📚', color: '#2a6a4a' },
      { value: 'history',           label: 'History',           icon: '🏛️', color: '#7a5a20' },
      { value: 'philosophy',        label: 'Philosophy',        icon: '🧠', color: '#4a4a7a' },
      { value: 'poetry',            label: 'Poetry',            icon: '✒️', color: '#6a3a5a' },
      { value: 'biography',         label: 'Biography',         icon: '👤', color: '#3a5a3a' },
      { value: 'self-help',         label: 'Self-Help',         icon: '🌱', color: '#4a7a2a' },
      { value: 'horror',            label: 'Horror',            icon: '🌑', color: '#3a1a1a' },
    ],
  },
  {
    id: 'reading_time',
    title: 'When do you usually read?',
    subtitle: 'Your ideal reading moment',
    type: 'single',
    options: [
      { value: 'morning',    label: 'Morning ritual',     icon: '☀️', desc: 'Fresh mind, fresh pages' },
      { value: 'afternoon',  label: 'Afternoon escape',   icon: '🌤️', desc: 'A break from the day'   },
      { value: 'evening',    label: 'Evening wind-down',  icon: '🌆', desc: 'Easing into the night'  },
      { value: 'night',      label: 'Late night pages',   icon: '🌙', desc: 'When the world is quiet' },
      { value: 'anytime',    label: 'Anytime I can',      icon: '📖', desc: 'Every spare moment'     },
    ],
  },
  {
    id: 'reading_speed',
    title: 'How would you describe your reading pace?',
    subtitle: 'No judgment — just helps us understand you',
    type: 'single',
    options: [
      { value: 'slow-deep',    label: 'Slow & deep',       icon: '🐢', desc: 'Every word, every nuance'    },
      { value: 'balanced',     label: 'Balanced',          icon: '⚖️', desc: 'Depends on the book'        },
      { value: 'fast',         label: 'Fast reader',       icon: '⚡', desc: 'I devour books quickly'      },
      { value: 'audiobook',    label: 'Audiobook person',  icon: '🎧', desc: 'I listen more than I read'   },
    ],
  },
  {
    id: 'vibe',
    title: 'What draws you most to a book?',
    subtitle: 'Your reading personality',
    type: 'single',
    options: [
      { value: 'escape',       label: 'Pure escape',       icon: '🌊', desc: 'Lose myself in another world' },
      { value: 'knowledge',    label: 'Learning',          icon: '🧠', desc: 'Expand my mind'              },
      { value: 'emotion',      label: 'Emotional depth',   icon: '💫', desc: 'Books that make me feel'     },
      { value: 'story',        label: 'Great storytelling',icon: '✨', desc: 'Craft and narrative'         },
      { value: 'ideas',        label: 'Big ideas',         icon: '💡', desc: 'Philosophy, theory, concepts' },
    ],
  },
];

// Shown only to WRITERS / BOTH
const WRITER_QUESTIONS = [
  {
    id: 'writing_genre',
    title: 'What do you write?',
    subtitle: 'Your craft and voice',
    type: 'multi',
    max: 3,
    options: [
      { value: 'fiction',       label: 'Fiction',           icon: '📖', color: '#8b6914' },
      { value: 'poetry',        label: 'Poetry',            icon: '✒️', color: '#6a3a5a' },
      { value: 'non-fiction',   label: 'Non-Fiction',       icon: '📝', color: '#2a6a4a' },
      { value: 'screenwriting', label: 'Screenwriting',     icon: '🎬', color: '#2a4a7a' },
      { value: 'short-stories', label: 'Short Stories',     icon: '📃', color: '#7a4a20' },
      { value: 'essays',        label: 'Essays',            icon: '🖊️', color: '#4a4a7a' },
      { value: 'fan-fiction',   label: 'Fan Fiction',       icon: '🌟', color: '#7a3a4a' },
      { value: 'experimental',  label: 'Experimental',      icon: '🔬', color: '#3a6a6a' },
    ],
  },
  {
    id: 'writing_stage',
    title: 'Where are you in your writing journey?',
    subtitle: 'Every stage is valid',
    type: 'single',
    options: [
      { value: 'just-starting',  label: 'Just starting out',   icon: '🌱', desc: 'Finding my voice'         },
      { value: 'in-progress',    label: 'Working on something', icon: '✍️', desc: 'Deep in a draft'         },
      { value: 'editing',        label: 'Editing & refining',   icon: '✂️', desc: 'Polishing my work'        },
      { value: 'published',      label: 'Published writer',     icon: '📚', desc: 'Out in the world'         },
      { value: 'exploring',      label: 'Exploring the craft',  icon: '🔍', desc: 'Learning and experimenting'},
    ],
  },
  {
    id: 'feedback_style',
    title: 'How do you prefer feedback on your writing?',
    subtitle: 'This shapes your BookChat experience',
    type: 'single',
    options: [
      { value: 'honest',        label: 'Honest & direct',    icon: '🎯', desc: 'Tell me what needs work'   },
      { value: 'encouraging',   label: 'Encouraging first',  icon: '💛', desc: 'Build me up, then critique'},
      { value: 'detailed',      label: 'Detailed analysis',  icon: '🔬', desc: 'Line by line feedback'     },
      { value: 'peer',          label: 'Peer exchange',      icon: '🤝', desc: 'I\'ll read yours too'      },
    ],
  },
];

// Final question for everyone
const FINAL_QUESTION = {
  id: 'discovery',
  title: 'How do you like to discover new books?',
  subtitle: 'We\'ll personalize your feed around this',
  type: 'single',
  options: [
    { value: 'recommendations', label: 'Friend recs',         icon: '👥', desc: 'Trusted taste'            },
    { value: 'browsing',        label: 'Browsing & exploring', icon: '🌐', desc: 'Happy accidents'          },
    { value: 'reviews',         label: 'Critics & reviews',   icon: '📰', desc: 'Informed decisions'       },
    { value: 'algorithm',       label: 'Smart suggestions',   icon: '✨', desc: 'Surprise me'              },
    { value: 'classics',        label: 'Curated classics',    icon: '🏛️', desc: 'Timeless first'           },
  ],
};

// ── Personality tag generator ────────────────────────────────────
function generatePersonalityTag(answers, role) {
  const vibes = {
    escape:    'The Escapist',
    knowledge: 'The Scholar',
    emotion:   'The Empath',
    story:     'The Storyteller',
    ideas:     'The Thinker',
  };

  const writerTags = {
    'just-starting':  'The Emerging Voice',
    'in-progress':    'The Active Dreamer',
    'editing':        'The Craftsperson',
    'published':      'The Published Author',
    'exploring':      'The Curious Writer',
  };

  if (role === 'writer' && answers.writing_stage) {
    return writerTags[answers.writing_stage] || 'The Writer';
  }
  if (role === 'both') {
    return answers.vibe ? `${vibes[answers.vibe]} & Writer` : 'The Writer-Reader';
  }
  return answers.vibe ? vibes[answers.vibe] : 'The Reader';
}

// ── Background ───────────────────────────────────────────────────
function Background({ progress }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <motion.div
        animate={{
          background: `linear-gradient(160deg, 
            hsl(${36 + progress * 20}, ${30 + progress * 20}%, ${97 - progress * 5}%) 0%, 
            hsl(${30 + progress * 15}, ${25 + progress * 15}%, ${95 - progress * 4}%) 100%)`
        }}
        transition={{ duration: 0.8 }}
        style={{ position: 'absolute', inset: 0 }}
      />
      <motion.div
        style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,122,30,0.07) 0%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(196,122,30,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(196,122,30,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}/>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = ((current) / total) * 100;
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '8px',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a7560' }}>
          Step {current} of {total}
        </span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c47a1e' }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div style={{
        height: '4px', background: 'rgba(196,122,30,0.12)',
        borderRadius: '4px', overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #8b5e00, #c47a1e, #e8a94a)',
            borderRadius: '4px',
          }}
        />
      </div>
      {/* Step dots */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', justifyContent: 'center' }}>
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i < current ? '20px' : '6px',
              background: i < current ? '#c47a1e' : 'rgba(196,122,30,0.2)',
            }}
            transition={{ duration: 0.3 }}
            style={{ height: '6px', borderRadius: '3px' }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Multi Select Option ──────────────────────────────────────────
function GenreChip({ option, selected, onClick, disabled }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      whileHover={!disabled || selected ? { scale: 1.03 } : {}}
      whileTap={!disabled || selected ? { scale: 0.97 } : {}}
      style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '9px 14px',
        borderRadius: '50px',
        border: `1.5px solid ${selected ? option.color || '#c47a1e' : 'rgba(196,122,30,0.18)'}`,
        background: selected
          ? `${option.color || '#c47a1e'}18`
          : 'rgba(255,255,255,0.7)',
        cursor: (disabled && !selected) ? 'not-allowed' : 'pointer',
        opacity: (disabled && !selected) ? 0.45 : 1,
        transition: 'all 0.2s',
        boxShadow: selected ? `0 2px 12px ${option.color || '#c47a1e'}25` : 'none',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{option.icon}</span>
      <span style={{
        fontSize: '0.8rem', fontWeight: selected ? 700 : 500,
        color: selected ? (option.color || '#c47a1e') : '#4a3c28',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}>
        {option.label}
      </span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ fontSize: '0.65rem', color: option.color || '#c47a1e' }}
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}

// ── Single Select Option ─────────────────────────────────────────
function SingleOption({ option, selected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01, x: 3 }}
      whileTap={{ scale: 0.99 }}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 18px',
        borderRadius: '14px',
        border: `1.5px solid ${selected ? 'rgba(196,122,30,0.5)' : 'rgba(196,122,30,0.12)'}`,
        background: selected
          ? 'linear-gradient(135deg, rgba(196,122,30,0.1), rgba(196,122,30,0.05))'
          : 'rgba(255,255,255,0.8)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        boxShadow: selected
          ? '0 4px 16px rgba(196,122,30,0.12), 0 0 0 1px rgba(196,122,30,0.1)'
          : '0 1px 4px rgba(0,0,0,0.04)',
        marginBottom: '8px',
      }}
    >
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{option.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.9rem', fontWeight: selected ? 700 : 500,
          color: selected ? '#8b5e00' : '#2a1e10',
          letterSpacing: '0.01em',
        }}>
          {option.label}
        </div>
        {option.desc && (
          <div style={{
            fontSize: '0.75rem', color: '#8a7560',
            marginTop: '2px', letterSpacing: '0.01em',
          }}>
            {option.desc}
          </div>
        )}
      </div>
      <motion.div
        animate={{
          scale: selected ? 1 : 0.5,
          opacity: selected ? 1 : 0,
          background: selected ? '#c47a1e' : 'transparent',
        }}
        style={{
          width: '20px', height: '20px', borderRadius: '50%',
          border: '2px solid',
          borderColor: selected ? '#c47a1e' : 'rgba(196,122,30,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'border-color 0.2s',
        }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}/>
      </motion.div>
    </motion.button>
  );
}

// ── Question Slide ───────────────────────────────────────────────
function QuestionSlide({ question, answer, onAnswer, direction }) {
  const isMulti  = question.type === 'multi';
  const selected = isMulti ? (answer || []) : answer;

  const handleMulti = (val) => {
    const current = selected || [];
    if (current.includes(val)) {
      onAnswer(current.filter(v => v !== val));
    } else if (current.length < (question.max || 99)) {
      onAnswer([...current, val]);
    }
  };

  const variants = {
    enter:  (d) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={question.id}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Question header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
            fontWeight: 800, color: '#1a1208',
            letterSpacing: '-0.02em', lineHeight: 1.25,
            marginBottom: '0.4rem',
          }}>
            {question.title}
          </h2>
          <p style={{ color: '#8a7560', fontSize: '0.85rem', letterSpacing: '0.01em' }}>
            {question.subtitle}
            {isMulti && question.max && (
              <span style={{ color: '#c47a1e', fontWeight: 600 }}>
                {' '}(up to {question.max})
              </span>
            )}
          </p>
        </div>

        {/* Options */}
        {isMulti ? (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            maxHeight: '320px', overflowY: 'auto',
            paddingBottom: '4px',
          }}>
            {question.options.map(opt => (
              <GenreChip
                key={opt.value}
                option={opt}
                selected={(selected || []).includes(opt.value)}
                onClick={() => handleMulti(opt.value)}
                disabled={(selected || []).length >= (question.max || 99)}
              />
            ))}
          </div>
        ) : (
          <div>
            {question.options.map(opt => (
              <SingleOption
                key={opt.value}
                option={opt}
                selected={selected === opt.value}
                onClick={() => onAnswer(opt.value)}
              />
            ))}
          </div>
        )}

        {/* Multi count */}
        {isMulti && (
          <motion.p
            animate={{ color: (selected || []).length > 0 ? '#c47a1e' : '#b0a090' }}
            style={{ fontSize: '0.75rem', marginTop: '10px', fontWeight: 600, letterSpacing: '0.04em' }}
          >
            {(selected || []).length} / {question.max} selected
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Completion Screen ────────────────────────────────────────────
function CompletionScreen({ personalityTag, role }) {
  const roleEmoji = { reader: '📖', writer: '✒️', both: '📚' };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: 'center', padding: '1rem 0' }}
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        style={{ fontSize: '4rem', marginBottom: '1.5rem' }}
      >
        {roleEmoji[role] || '📖'}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          fontSize: 'clamp(1.4rem, 5vw, 1.8rem)',
          fontWeight: 800, color: '#1a1208',
          letterSpacing: '-0.02em', marginBottom: '0.5rem',
        }}
      >
        Your profile is ready
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          display: 'inline-block',
          padding: '6px 18px',
          background: 'rgba(196,122,30,0.1)',
          border: '1px solid rgba(196,122,30,0.3)',
          borderRadius: '50px',
          marginBottom: '1.25rem',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c47a1e', letterSpacing: '0.04em' }}>
          ✦ {personalityTag}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ color: '#6a5840', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto 2rem' }}
      >
        We've crafted your BookChat experience around your reading personality.
        Your library awaits.
      </motion.p>

      {/* Animated stars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '2rem' }}
      >
        {['✦', '◆', '✦', '◆', '✦'].map((s, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 0.6, 0.3], y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            style={{ color: '#c47a1e', fontSize: '0.8rem' }}
          >
            {s}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── Main Quiz Page ───────────────────────────────────────────────
export default function Quiz() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  const role = user?.role || 'reader';

  // Build question list based on role
  const questions = [
    ...COMMON_QUESTIONS,
    ...(role === 'writer' || role === 'both' ? WRITER_QUESTIONS : []),
    FINAL_QUESTION,
  ];

  const [step,          setStep]          = useState(0);
  const [answers,       setAnswers]       = useState({});
  const [direction,     setDirection]     = useState(1);
  const [completing,    setCompleting]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [personalityTag, setPersonalityTag] = useState('');

  const pageRef = useRef(null);
  const cardRef = useRef(null);
  const topRef  = useRef(null);

  const currentQ   = questions[step];
  const totalSteps = questions.length;
  const currentAns = answers[currentQ?.id];
  const canNext    = currentQ?.type === 'multi'
    ? (currentAns && currentAns.length > 0)
    : !!currentAns;

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [topRef.current, cardRef.current],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.15, delay: 0.1 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const goNext = async () => {
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      // Last step — save & complete
      await handleComplete();
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    const tag = generatePersonalityTag(answers, role);
    setPersonalityTag(tag);

    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          genres:            answers.genres           || [],
          readingTime:       answers.reading_time     || '',
          readingSpeed:      answers.reading_speed    || '',
          readingVibe:       answers.vibe             || '',
          discoveryStyle:    answers.discovery        || '',
          writingGenres:     answers.writing_genre    || [],
          writingStage:      answers.writing_stage    || '',
          feedbackStyle:     answers.feedback_style   || '',
          personalityTag:    tag,
          onboardingComplete: true,
          updatedAt:         Date.now(),
        });
      }

      setCompleting(true);

      // Auto-navigate after showing completion screen
      setTimeout(() => {
        gsap.to(pageRef.current, {
          opacity: 0, duration: 0.5,
          onComplete: () => navigate('/home'),
        });
      }, 2800);

    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.25rem',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <Background progress={step / totalSteps} />

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>

        {/* Top: Logo + skip */}
        <div ref={topRef} style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '1.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#c47a1e" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#c47a1e" strokeWidth="1.5"/>
            </svg>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a1208', letterSpacing: '-0.01em' }}>
              BookChat
            </span>
          </div>
          {!completing && (
            <motion.button
              type="button"
              onClick={handleComplete}
              whileHover={{ color: '#c47a1e' }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#b0a090', fontSize: '0.75rem', fontFamily: 'Gilroy, sans-serif',
                fontWeight: 600, letterSpacing: '0.04em',
                transition: 'color 0.2s',
              }}
            >
              Skip setup →
            </motion.button>
          )}
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          style={{
            background: 'rgba(255,255,255,0.94)',
            border: '1px solid rgba(196,122,30,0.12)',
            borderRadius: '24px',
            padding: 'clamp(1.5rem, 6vw, 2.25rem)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 4px 16px rgba(196,122,30,0.06)',
            position: 'relative', overflow: 'hidden',
            minHeight: '460px',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Card top shimmer */}
          <div style={{
            position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(196,122,30,0.25), transparent)',
          }}/>

          {!completing ? (
            <>
              {/* Progress */}
              <ProgressBar current={step + 1} total={totalSteps} />

              {/* Question */}
              <div style={{ flex: 1 }}>
                <QuestionSlide
                  question={currentQ}
                  answer={answers[currentQ?.id]}
                  onAnswer={(val) => setAnswers(prev => ({ ...prev, [currentQ.id]: val }))}
                  direction={direction}
                />
              </div>

              {/* Navigation */}
              <div style={{
                display: 'flex', gap: '10px',
                marginTop: '1.75rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(196,122,30,0.08)',
              }}>
                {/* Back */}
                {step > 0 && (
                  <motion.button
                    type="button"
                    onClick={goBack}
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '13px 20px',
                      background: 'transparent',
                      border: '1.5px solid rgba(196,122,30,0.2)',
                      borderRadius: '12px', cursor: 'pointer',
                      color: '#8a7560', fontFamily: 'Gilroy, sans-serif',
                      fontSize: '0.88rem', fontWeight: 600,
                      transition: 'all 0.2s', letterSpacing: '0.02em',
                    }}
                  >
                    <ArrowLeft size={15}/> Back
                  </motion.button>
                )}

                {/* Next / Finish */}
                <motion.button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext || saving}
                  whileHover={canNext ? { scale: 1.01 } : {}}
                  whileTap={canNext ? { scale: 0.98 } : {}}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    background: canNext
                      ? 'linear-gradient(135deg, #7a4800, #c47a1e, #e8a84a)'
                      : 'rgba(196,122,30,0.1)',
                    border: `1.5px solid ${canNext ? 'rgba(196,122,30,0.25)' : 'rgba(196,122,30,0.1)'}`,
                    borderRadius: '12px',
                    cursor: canNext ? 'pointer' : 'not-allowed',
                    color: canNext ? '#fdf0e0' : '#b0a090',
                    fontFamily: 'Gilroy, sans-serif',
                    fontSize: '0.95rem', fontWeight: 700,
                    letterSpacing: '0.03em',
                    boxShadow: canNext ? '0 4px 20px rgba(196,122,30,0.2)' : 'none',
                    transition: 'all 0.3s',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {canNext && (
                    <motion.div
                      style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
                      initial={{ x: '-100%' }} whileHover={{ x: '100%' }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                  {saving ? (
                    <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'bc-spin 1s linear infinite' }}/> Saving...</>
                  ) : step === totalSteps - 1 ? (
                    <><Sparkles size={16}/> Complete Setup</>
                  ) : (
                    <>Continue <ArrowRight size={15} strokeWidth={2.5}/></>
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CompletionScreen personalityTag={personalityTag} role={role} />
            </div>
          )}

          <div style={{
            position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(196,122,30,0.12), transparent)',
          }}/>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{
            textAlign: 'center', marginTop: '1.5rem',
            color: '#b0a090', fontSize: '0.65rem',
            letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
          }}
        >
          Where Readers Meet &nbsp;✦&nbsp; Quietly
        </motion.p>
      </div>

      <style>{`
        @keyframes bc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(196,122,30,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}