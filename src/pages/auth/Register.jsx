import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Eye, EyeOff, Loader2, ArrowRight, BookOpen, PenLine, Library, Check } from 'lucide-react';

// ── Form Hook ────────────────────────────────────────────────────
function useRegisterForm() {
  const [values, setValues] = useState({
    displayName: '', username: '', email: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const validate = (vals) => {
    const errs = {};
    if (!vals.displayName) errs.displayName = 'Full name is required';
    else if (vals.displayName.trim().length < 2) errs.displayName = 'Name must be at least 2 characters';

    if (!vals.username) errs.username = 'Username is required';
    else if (vals.username.length < 3) errs.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(vals.username)) errs.username = 'Only letters, numbers and underscores';

    if (!vals.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(vals.email)) errs.email = 'Enter a valid email address';

    if (!vals.password) errs.password = 'Password is required';
    else if (vals.password.length < 8) errs.password = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(vals.password)) errs.password = 'Include at least one uppercase letter';
    else if (!/[0-9]/.test(vals.password)) errs.password = 'Include at least one number';

    if (!vals.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (vals.confirmPassword !== vals.password) errs.confirmPassword = 'Passwords do not match';

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const errs = validate({ ...values, [name]: value });
      setErrors(prev => ({ ...prev, [name]: errs[name] || '' }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const errs = validate(values);
    setErrors(prev => ({ ...prev, [name]: errs[name] || '' }));
  };

  const handleSubmit = (onSubmit) => (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched({ displayName: true, username: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(errs).length === 0) onSubmit(values);
  };

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, setErrors };
}

// ── Password Strength ────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#c0624a', '#d4922a', '#5a9a3a'];
  const labels = ['Weak', 'Fair', 'Strong'];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      style={{ marginTop: '8px' }}
    >
      {/* Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i < score ? colors[score - 1] : 'rgba(196,122,30,0.1)',
            transition: 'background 0.3s',
          }}/>
        ))}
      </div>
      {/* Checks */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {checks.map((c, i) => (
          <motion.span
            key={i}
            animate={{ color: c.ok ? '#5a9a3a' : '#8a7560' }}
            style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px', letterSpacing: '0.02em' }}
          >
            <motion.span animate={{ scale: c.ok ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.2 }}>
              {c.ok ? '✓' : '○'}
            </motion.span>
            {c.label}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Magnetic Button ──────────────────────────────────────────────
function MagneticButton({ children, onClick, disabled, style, type = 'button' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e) => {
    if (disabled) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.25);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.25);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref} type={type}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      style={{ x: sx, y: sy, ...style }}
      whileTap={!disabled ? { scale: 0.97 } : {}}
    >
      {children}
    </motion.button>
  );
}

// ── Particles ────────────────────────────────────────────────────
const PARTICLES = [
  '📖','✦','📚','◆','✒️','◇','📝','✧','🔖','❋','◈','📕','✦','◆','📗','✧','⬡','📘',
];

function Particles() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {PARTICLES.map((sym, i) => {
        const startX = Math.random() * 100;
        const dur    = 20 + Math.random() * 20;
        const drift  = (Math.random() - 0.5) * 12;
        return (
          <motion.div
            key={i}
            initial={{ x: `${startX}vw`, y: '108vh', opacity: 0, rotate: 0 }}
            animate={{
              y: '-8vh',
              x: [`${startX}vw`, `${startX + drift}vw`, `${startX}vw`],
              opacity: [0, 0.12 + Math.random() * 0.08, 0.1, 0],
              rotate: Math.random() > 0.5 ? 360 : -360,
            }}
            transition={{
              duration: dur, repeat: Infinity,
              delay: Math.random() * 16, ease: 'linear',
              x: { duration: dur, repeat: Infinity, delay: Math.random() * 16, ease: 'easeInOut' },
            }}
            style={{
              position: 'absolute',
              fontSize: `${0.7 + Math.random() * 0.9}rem`,
              color: i % 3 === 0 ? '#c47a1e' : i % 3 === 1 ? '#8b6010' : '#6b4a08',
            }}
          >
            {sym}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Background ───────────────────────────────────────────────────
function Background() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: '#faf6ef' }}/>
      <motion.div
        style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '70vw', height: '70vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,122,30,0.07) 0%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute', bottom: '-25%', right: '-15%',
          width: '65vw', height: '65vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(160,100,10,0.05) 0%, transparent 60%)',
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(196,122,30,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(196,122,30,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}/>
      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '20vh',
        background: 'linear-gradient(to top, #faf6ef, transparent)',
      }}/>
    </div>
  );
}

// ── Input Field ──────────────────────────────────────────────────
function Field({ label, name, type, placeholder, value, onChange, onBlur, error, touched, suffix, prefix, hint }) {
  const [focused, setFocused] = useState(false);
  const hasError = touched && error;

  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <motion.label
        animate={{ color: hasError ? '#b05040' : focused ? '#c47a1e' : '#6a5840' }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'block', fontSize: '0.65rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '7px',
        }}
      >
        {label}
      </motion.label>

      <div style={{ position: 'relative' }}>
        {/* Focus ring */}
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: '-2px', borderRadius: '13px',
                background: hasError ? 'rgba(180,80,60,0.04)' : 'rgba(196,122,30,0.04)',
                border: `1px solid ${hasError ? 'rgba(180,80,60,0.25)' : 'rgba(196,122,30,0.3)'}`,
                pointerEvents: 'none', zIndex: 0,
              }}
            />
          )}
        </AnimatePresence>

        {prefix && (
          <div style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', zIndex: 2,
            color: focused ? '#c47a1e' : '#8a7560',
            fontSize: '0.9rem', fontWeight: 600,
            transition: 'color 0.2s',
          }}>
            {prefix}
          </div>
        )}

        <input
          name={name} type={type} placeholder={placeholder}
          value={value} onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); onBlur(e); }}
          autoComplete={
            name === 'password' ? 'new-password'
            : name === 'confirmPassword' ? 'new-password'
            : name === 'email' ? 'email'
            : 'off'
          }
          style={{
            position: 'relative', zIndex: 1, width: '100%',
            background: focused ? '#fff' : '#f5f0e8',
            border: `1px solid ${
              hasError ? 'rgba(180,80,60,0.4)'
              : focused ? 'rgba(196,122,30,0.45)'
              : 'rgba(196,122,30,0.18)'
            }`,
            borderRadius: '11px',
            padding: `12px ${suffix ? '44px' : '16px'} 12px ${prefix ? '32px' : '16px'}`,
            color: '#1a1208', fontFamily: 'Gilroy, sans-serif',
            fontSize: '0.92rem', fontWeight: 400, outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: focused
              ? '0 0 0 3px rgba(196,122,30,0.07), 0 2px 12px rgba(0,0,0,0.06)'
              : '0 1px 4px rgba(0,0,0,0.04)',
          }}
        />

        {suffix && (
          <div style={{
            position: 'absolute', right: '12px',
            top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          }}>
            {suffix}
          </div>
        )}

        {/* Bottom shimmer */}
        <motion.div
          animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', bottom: 0, left: '12px', right: '12px',
            height: '1px', zIndex: 2, transformOrigin: 'center',
            background: hasError
              ? 'linear-gradient(90deg, transparent, #b05040, transparent)'
              : 'linear-gradient(90deg, transparent, #c47a1e 30%, #f0b84a 50%, #c47a1e 70%, transparent)',
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {hasError && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ color: '#b05040', fontSize: '0.7rem', marginTop: '5px', paddingLeft: '2px' }}
          >
            {error}
          </motion.p>
        )}
        {hint && !hasError && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ color: '#8a7560', fontSize: '0.68rem', marginTop: '5px', paddingLeft: '2px', fontStyle: 'italic' }}
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Role Selector ────────────────────────────────────────────────
const ROLES = [
  { value: 'reader', label: 'Reader',      icon: BookOpen, desc: 'I love to read' },
  { value: 'writer', label: 'Writer',      icon: PenLine,  desc: 'I love to write' },
  { value: 'both',   label: 'Both',        icon: Library,  desc: 'Reader & writer' },
];

function RoleSelector({ selected, onChange }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{
        display: 'block', fontSize: '0.65rem', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#6a5840', marginBottom: '9px',
      }}>
        I am a
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        {ROLES.map(role => {
          const Icon = role.icon;
          const active = selected === role.value;
          return (
            <motion.button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '5px',
                padding: '12px 6px',
                borderRadius: '12px',
                border: `1px solid ${active ? 'rgba(196,122,30,0.5)' : 'rgba(196,122,30,0.15)'}`,
                background: active
                  ? 'linear-gradient(145deg, rgba(196,122,30,0.12), rgba(196,122,30,0.06))'
                  : '#f5f0e8',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: active ? '0 0 0 2px rgba(196,122,30,0.15), 0 4px 12px rgba(196,122,30,0.1)' : 'none',
              }}
            >
              <Icon
                size={16}
                color={active ? '#c47a1e' : '#8a7560'}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span style={{
                fontSize: '0.72rem', fontWeight: active ? 700 : 500,
                color: active ? '#c47a1e' : '#6a5840',
                letterSpacing: '0.02em',
              }}>
                {role.label}
              </span>
              {active && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: '#c47a1e',
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Community Pledge ─────────────────────────────────────────────
function Pledge({ accepted, onToggle }) {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(196,122,30,0.4)' }}
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '14px 16px',
        background: accepted ? 'rgba(196,122,30,0.06)' : '#f5f0e8',
        border: `1px solid ${accepted ? 'rgba(196,122,30,0.35)' : 'rgba(196,122,30,0.15)'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        marginBottom: '1.25rem',
        transition: 'all 0.2s',
      }}
    >
      {/* Checkbox */}
      <motion.div
        animate={{
          background: accepted ? '#c47a1e' : 'transparent',
          borderColor: accepted ? '#c47a1e' : 'rgba(196,122,30,0.35)',
        }}
        style={{
          width: '18px', height: '18px', borderRadius: '5px',
          border: '1.5px solid',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: '1px',
          transition: 'all 0.2s',
        }}
      >
        <AnimatePresence>
          {accepted && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Check size={11} color="#fff" strokeWidth={3}/>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div>
        <p style={{ fontSize: '0.78rem', color: '#3a2e20', lineHeight: 1.55, fontWeight: 500 }}>
          I pledge to be here for <span style={{ color: '#c47a1e', fontWeight: 700 }}>books, ideas, and genuine connections</span> — keeping this space thoughtful and kind.
        </p>
      </div>
    </motion.div>
  );
}

// ── Register Page ────────────────────────────────────────────────
export default function Register() {
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role,        setRole]        = useState('reader');
  const [pledged,     setPledged]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [gLoading,    setGLoading]    = useState(false);
  const [serverError, setServerError] = useState('');
  const [success,     setSuccess]     = useState(false);
  const navigate = useNavigate();

  const pageRef  = useRef(null);
  const logoRef  = useRef(null);
  const headRef  = useRef(null);
  const cardRef  = useRef(null);
  const footRef  = useRef(null);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, setErrors } = useRegisterForm();

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([logoRef.current, headRef.current, cardRef.current, footRef.current], {
        opacity: 0, y: 24,
      });
      const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.9 } });
      tl.to(logoRef.current, { opacity: 1, y: 0, delay: 0.1 })
        .to(headRef.current,  { opacity: 1, y: 0 }, '-=0.6')
        .to(cardRef.current,  { opacity: 1, y: 0, duration: 1 }, '-=0.5')
        .to(footRef.current,  { opacity: 1, y: 0, duration: 0.7 }, '-=0.4');
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const onSubmit = async (data) => {
    if (!pledged) {
      setServerError('Please accept the community pledge to continue.');
      gsap.to(cardRef.current, {
        keyframes: [{ x: -8 }, { x: 8 }, { x: -5 }, { x: 5 }, { x: 0 }],
        duration: 0.4,
      });
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      // Check username uniqueness
      const usernameQ = query(
        collection(db, 'users'),
        where('username', '==', data.username.toLowerCase())
      );
      const usernameSnap = await getDocs(usernameQ);
      if (!usernameSnap.empty) {
        setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.displayName });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: data.email,
        displayName: data.displayName,
        username: data.username.toLowerCase(),
        photoURL: '',
        role,
        bio: '',
        genres: [],
        readingMood: 'just-browsing',
        isPublic: true,
        connections: [],
        onboardingComplete: false,
        createdAt: Date.now(),
      });

      setSuccess(true);
      gsap.to(cardRef.current, {
        boxShadow: '0 0 60px rgba(196,122,30,0.2)',
        duration: 0.5,
      });
      gsap.to(pageRef.current, {
        opacity: 0, duration: 0.5, delay: 0.7,
        onComplete: () => navigate('/quiz'),
      });

    } catch (err) {
      gsap.to(cardRef.current, {
        keyframes: [{ x: -10 }, { x: 10 }, { x: -6 }, { x: 6 }, { x: 0 }],
        duration: 0.4,
      });
      setServerError(
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : 'Something went wrong. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGLoading(true);
    setServerError('');
    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(auth, provider);
      const userRef  = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        uid: result.user.uid, email: result.user.email,
        displayName: result.user.displayName || '',
        username: result.user.email.split('@')[0],
        photoURL: result.user.photoURL || '',
        role, genres: [], readingMood: 'just-browsing',
        isPublic: true, connections: [], onboardingComplete: false,
        createdAt: Date.now(),
      }, { merge: true });

      gsap.to(pageRef.current, {
        opacity: 0, duration: 0.4,
        onComplete: () => navigate('/quiz'),
      });
    } catch {
      setServerError('Google sign-up failed. Please try again.');
      setGLoading(false);
    }
  };

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
      <Background />
      <Particles />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div ref={logoRef} style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(145deg, #fff, #f5f0e8)',
            border: '1px solid rgba(196,122,30,0.25)',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(196,122,30,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            marginBottom: '1.25rem',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#c47a1e" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#c47a1e" strokeWidth="1.5"/>
              <line x1="9" y1="7" x2="15" y2="7" stroke="#e8a94a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
              <line x1="9" y1="10.5" x2="13" y2="10.5" stroke="#e8a94a" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
            </svg>
            <div style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderTop: '1.5px solid rgba(196,122,30,0.5)', borderRight: '1.5px solid rgba(196,122,30,0.5)' }}/>
            <div style={{ position: 'absolute', bottom: 6, left: 6, width: 6, height: 6, borderBottom: '1.5px solid rgba(196,122,30,0.5)', borderLeft: '1.5px solid rgba(196,122,30,0.5)' }}/>
          </div>

          <div ref={headRef}>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.8rem)', fontWeight: 800,
              color: '#1a1208', letterSpacing: '-0.025em',
              marginBottom: '0.3rem', lineHeight: 1.1,
            }}>
              Create your account
            </h1>
            <p style={{ color: '#8a7560', fontSize: '0.82rem', letterSpacing: '0.02em' }}>
              Join a community of passionate readers
            </p>
          </div>
        </div>

        {/* Ornament */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(196,122,30,0.25))' }}/>
          <span style={{ color: 'rgba(196,122,30,0.4)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>✦ &nbsp; B O O K C H A T &nbsp; ✦</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(196,122,30,0.25), transparent)' }}/>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          style={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(196,122,30,0.12)',
            borderRadius: '22px',
            padding: 'clamp(1.5rem, 5vw, 2.25rem)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(196,122,30,0.06)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Card top shimmer */}
          <div style={{
            position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(196,122,30,0.2), transparent)',
          }}/>

          {/* Google */}
          <MagneticButton
            onClick={handleGoogle} disabled={gLoading}
            style={{
              width: '100%',
              background: '#f8f4ed',
              color: '#3a2e20',
              border: '1px solid rgba(196,122,30,0.2)',
              borderRadius: '12px', padding: '13px 20px',
              fontFamily: 'Gilroy, sans-serif', fontSize: '0.88rem', fontWeight: 600,
              cursor: gLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', marginBottom: '1.5rem',
              letterSpacing: '0.02em', transition: 'all 0.2s',
              opacity: gLoading ? 0.6 : 1, position: 'relative', overflow: 'hidden',
            }}
          >
            <motion.div
              style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(196,122,30,0.04), transparent)' }}
              initial={{ x: '-100%' }} whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
            {gLoading
              ? <Loader2 size={16} style={{ animation: 'bc-spin 1s linear infinite' }}/>
              : <svg width="17" height="17" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
            }
            Sign up with Google
          </MagneticButton>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(196,122,30,0.1)' }}/>
            <span style={{ color: '#b0a090', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              or create with email
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(196,122,30,0.1)' }}/>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Role */}
            <RoleSelector selected={role} onChange={setRole} />

            {/* Name + Username side by side on larger screens */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field
                label="Full Name" name="displayName" type="text"
                placeholder="Your name"
                value={values.displayName} onChange={handleChange} onBlur={handleBlur}
                error={errors.displayName} touched={touched.displayName}
              />
              <Field
                label="Username" name="username" type="text"
                placeholder="bookworm"
                value={values.username} onChange={handleChange} onBlur={handleBlur}
                error={errors.username} touched={touched.username}
                prefix="@"
              />
            </div>

            <Field
              label="Email Address" name="email" type="email"
              placeholder="you@example.com"
              value={values.email} onChange={handleChange} onBlur={handleBlur}
              error={errors.email} touched={touched.email}
            />

            <Field
              label="Password" name="password"
              type={showPass ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={values.password} onChange={handleChange} onBlur={handleBlur}
              error={errors.password} touched={touched.password}
              suffix={
                <motion.button type="button" onClick={() => setShowPass(p => !p)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ background: 'none', border: 'none', color: '#8a7560', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c47a1e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8a7560'}
                >
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </motion.button>
              }
            />

            {/* Password strength */}
            {values.password && <PasswordStrength password={values.password} />}

            <div style={{ marginTop: values.password ? '0.75rem' : 0 }}>
              <Field
                label="Confirm Password" name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                error={errors.confirmPassword} touched={touched.confirmPassword}
                suffix={
                  <motion.button type="button" onClick={() => setShowConfirm(p => !p)}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    style={{ background: 'none', border: 'none', color: '#8a7560', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c47a1e'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8a7560'}
                  >
                    {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </motion.button>
                }
              />
            </div>

            {/* Pledge */}
            <Pledge accepted={pledged} onToggle={() => setPledged(p => !p)} />

            {/* Error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    background: 'rgba(180,80,60,0.06)', border: '1px solid rgba(180,80,60,0.2)',
                    borderRadius: '10px', padding: '11px 15px', color: '#b05040',
                    fontSize: '0.78rem', marginBottom: '1.1rem',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  <span>⚠</span> {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <MagneticButton
              type="submit" disabled={loading || success}
              style={{
                width: '100%',
                background: success
                  ? 'linear-gradient(135deg, #2a6a1a, #3a8a22)'
                  : 'linear-gradient(135deg, #7a4800 0%, #b87018 40%, #d49030 70%, #e8a840 100%)',
                color: '#fdf0e0',
                border: `1px solid ${success ? 'rgba(80,180,60,0.3)' : 'rgba(196,122,30,0.2)'}`,
                borderRadius: '13px', padding: '15px 24px',
                fontFamily: 'Gilroy, sans-serif', fontSize: '0.95rem', fontWeight: 700,
                cursor: (loading || success) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                letterSpacing: '0.04em',
                boxShadow: (loading || success) ? 'none' : '0 6px 24px rgba(196,122,30,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition: 'all 0.3s', opacity: loading ? 0.75 : 1,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {!loading && !success && (
                <motion.div
                  style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
                  initial={{ x: '-100%' }} whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              )}
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.span key="s" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✓ &nbsp;Account created!
                  </motion.span>
                ) : loading ? (
                  <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={16} style={{ animation: 'bc-spin 1s linear infinite' }}/>
                    Creating account...
                  </motion.span>
                ) : (
                  <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Create Account &nbsp;<ArrowRight size={15} strokeWidth={2.5}/>
                  </motion.span>
                )}
              </AnimatePresence>
            </MagneticButton>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(196,122,30,0.08)', textAlign: 'center' }}>
            <p style={{ color: '#8a7560', fontSize: '0.83rem' }}>
              Already have an account?{' '}
              <Link to="/login"
                style={{ color: '#c47a1e', textDecoration: 'none', fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.color = '#d4922a'}
                onMouseLeave={e => e.currentTarget.style.color = '#c47a1e'}
              >
                Sign in
              </Link>
            </p>
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(196,122,30,0.15), transparent)' }}/>
        </div>

        {/* Tagline */}
        <div ref={footRef} style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <p style={{ color: '#c0b090', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
            Where Readers Meet &nbsp;✦&nbsp; Quietly
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #f5f0e8 inset !important;
          -webkit-text-fill-color: #1a1208 !important;
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}