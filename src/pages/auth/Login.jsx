import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

// ── Colors ───────────────────────────────────────────────────────
const C = {
  bg:          '#f2ebe0',       // warm parchment
  bgDeep:      '#ebe2d4',       // slightly deeper
  bgCard:      '#faf6f0',       // card surface
  bgInput:     '#f5efe5',       // input bg
  bgInputFocus:'#fff9f3',       // input focused
  border:      'rgba(160,120,60,0.18)',
  borderFocus: 'rgba(160,100,20,0.45)',
  amber:       '#b06a10',       // main amber
  amberLight:  '#d4892a',       // lighter amber
  amberGlow:   '#e8a030',       // glow amber
  text:        '#1e1408',       // primary text
  textSub:     '#6b5440',       // subtitle
  textMuted:   '#a08060',       // muted
  textFaint:   '#c4a880',       // very faint
  error:       '#b04030',
  errorBg:     'rgba(176,64,48,0.06)',
  errorBorder: 'rgba(176,64,48,0.2)',
};

// ── Form Hook ────────────────────────────────────────────────────
function useLoginForm() {
  const [values, setValues]   = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const validate = (vals) => {
    const errs = {};
    if (!vals.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(vals.email)) errs.email = 'Enter a valid email address';
    if (!vals.password) errs.password = 'Password is required';
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
    setTouched({ email: true, password: true });
    if (Object.keys(errs).length === 0) onSubmit(values);
  };

  return { values, errors, touched, handleChange, handleBlur, handleSubmit };
}

// ── Magnetic Button ───────────────────────────────────────────────
function MagneticButton({ children, onClick, disabled, style, type = 'button' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e) => {
    if (disabled) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.2);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.2);
  };

  return (
    <motion.button
      ref={ref} type={type}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick} disabled={disabled}
      style={{ x: sx, y: sy, ...style }}
      whileTap={!disabled ? { scale: 0.97 } : {}}
    >
      {children}
    </motion.button>
  );
}

// ── Particles ────────────────────────────────────────────────────
const PARTICLES = [
  { sym: '📖', size: 1.3 }, { sym: '✦',  size: 0.9 },
  { sym: '📚', size: 1.2 }, { sym: '◆',  size: 0.75 },
  { sym: '✒️', size: 1.0 }, { sym: '◇',  size: 0.8 },
  { sym: '📝', size: 1.1 }, { sym: '✧',  size: 0.7 },
  { sym: '🔖', size: 0.9 }, { sym: '❋',  size: 0.8 },
  { sym: '◈',  size: 0.7 }, { sym: '📕', size: 1.2 },
  { sym: '✦',  size: 0.65 },{ sym: '📗', size: 1.1 },
  { sym: '◆',  size: 0.9 }, { sym: '📘', size: 1.0 },
];

function Particles() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {PARTICLES.map((p, i) => {
        const startX = 5 + Math.random() * 90;
        const dur    = 20 + Math.random() * 25;
        const delay  = Math.random() * 18;
        const drift  = (Math.random() - 0.5) * 12;
        return (
          <motion.div
            key={i}
            initial={{ x: `${startX}vw`, y: '110vh', opacity: 0, rotate: 0 }}
            animate={{
              y: '-10vh',
              x: [`${startX}vw`, `${startX + drift}vw`, `${startX}vw`],
              opacity: [0, 0.12 + Math.random() * 0.1, 0.1, 0],
              rotate: Math.random() > 0.5 ? [0, 180, 360] : [0, -180, -360],
            }}
            transition={{
              duration: dur, repeat: Infinity, delay, ease: 'linear',
              x: { duration: dur, repeat: Infinity, delay, ease: 'easeInOut' },
            }}
            style={{
              position: 'absolute',
              fontSize: `${p.size}rem`,
              filter: 'blur(0.3px)',
              color: i % 3 === 0 ? C.amber : i % 3 === 1 ? C.amberLight : C.textMuted,
            }}
          >
            {p.sym}
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
      {/* Warm parchment base */}
      <div style={{ position: 'absolute', inset: 0, background: C.bg }}/>

      {/* Top-left amber glow */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-25%', left: '-15%',
          width: '75vw', height: '75vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,140,40,0.12) 0%, transparent 65%)',
        }}
      />

      {/* Bottom-right warm shadow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          position: 'absolute', bottom: '-25%', right: '-15%',
          width: '65vw', height: '65vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(160,100,20,0.09) 0%, transparent 65%)',
        }}
      />

      {/* Center soft warm spot */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', top: '35%', left: '25%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,170,60,0.06) 0%, transparent 65%)',
        }}
      />

      {/* Subtle paper texture lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(160,100,20,0.03) 28px, rgba(160,100,20,0.03) 29px)',
        pointerEvents: 'none',
      }}/>

      {/* Fine noise */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}/>
    </div>
  );
}

// ── Input Field ──────────────────────────────────────────────────
function PremiumInput({ label, name, type, placeholder, value, onChange, onBlur, error, touched, suffix }) {
  const [focused, setFocused] = useState(false);
  const hasError = touched && error;

  return (
    <div style={{ marginBottom: '1.3rem' }}>
      <motion.label
        animate={{ color: hasError ? C.error : focused ? C.amber : C.textSub }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'block', fontSize: '0.65rem', fontWeight: 700,
          letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: '8px',
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
                border: `1.5px solid ${hasError ? C.errorBorder : C.borderFocus}`,
                background: hasError ? C.errorBg : 'rgba(176,106,16,0.04)',
                pointerEvents: 'none', zIndex: 0,
              }}
            />
          )}
        </AnimatePresence>

        <input
          name={name} type={type} placeholder={placeholder}
          value={value} onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); onBlur(e); }}
          autoComplete={name === 'password' ? 'current-password' : 'email'}
          style={{
            position: 'relative', zIndex: 1, width: '100%',
            background: focused ? C.bgInputFocus : C.bgInput,
            border: `1px solid ${hasError ? C.errorBorder : focused ? C.borderFocus : C.border}`,
            borderRadius: '12px',
            padding: `13px ${suffix ? '46px' : '16px'} 13px 16px`,
            color: C.text, fontFamily: 'Gilroy, sans-serif',
            fontSize: '0.95rem', fontWeight: 400, outline: 'none',
            transition: 'all 0.22s ease',
            boxShadow: focused
              ? `0 0 0 3px rgba(176,106,16,0.08), 0 2px 12px rgba(0,0,0,0.06)`
              : `0 1px 4px rgba(0,0,0,0.05)`,
          }}
        />

        {suffix && (
          <div style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
            {suffix}
          </div>
        )}

        {/* Bottom shimmer */}
        <motion.div
          animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', bottom: 0, left: '14px', right: '14px', height: '1.5px',
            background: hasError
              ? `linear-gradient(90deg, transparent, ${C.error}, transparent)`
              : `linear-gradient(90deg, transparent, ${C.amber} 30%, ${C.amberGlow} 50%, ${C.amber} 70%, transparent)`,
            transformOrigin: 'center', borderRadius: '1px', zIndex: 2,
          }}
        />
      </div>

      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ color: C.error, fontSize: '0.72rem', marginTop: '6px', paddingLeft: '2px', letterSpacing: '0.01em' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Login Page ───────────────────────────────────────────────
export default function Login() {
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [gLoading,    setGLoading]    = useState(false);
  const [serverError, setServerError] = useState('');
  const [success,     setSuccess]     = useState(false);
  const navigate = useNavigate();

  const pageRef  = useRef(null);
  const badgeRef = useRef(null);
  const headRef  = useRef(null);
  const subRef   = useRef(null);
  const ornRef   = useRef(null);
  const cardRef  = useRef(null);
  const footRef  = useRef(null);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useLoginForm();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([badgeRef.current, headRef.current, subRef.current, ornRef.current, cardRef.current, footRef.current], {
        opacity: 0, y: 20,
      });
      const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.85 } });
      tl.to(badgeRef.current, { opacity: 1, y: 0, delay: 0.1 })
        .to(headRef.current,  { opacity: 1, y: 0 }, '-=0.55')
        .to(subRef.current,   { opacity: 1, y: 0 }, '-=0.6')
        .to(ornRef.current,   { opacity: 1, y: 0 }, '-=0.55')
        .to(cardRef.current,  { opacity: 1, y: 0, duration: 1 }, '-=0.5')
        .to(footRef.current,  { opacity: 1, y: 0, duration: 0.6 }, '-=0.35');

      gsap.to(badgeRef.current, {
        filter: 'drop-shadow(0 4px 12px rgba(176,106,16,0.25))',
        duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.5,
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const result  = await signInWithEmailAndPassword(auth, data.email, data.password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      setSuccess(true);
      gsap.to(cardRef.current, { scale: 0.99, boxShadow: `0 0 60px rgba(176,106,16,0.18)`, duration: 0.35 });
      gsap.to(pageRef.current, {
        opacity: 0, duration: 0.5, delay: 0.65,
        onComplete: () => {
          if (userDoc.exists() && !userDoc.data().onboardingComplete) navigate('/quiz');
          else navigate('/home');
        }
      });
    } catch (err) {
      gsap.timeline()
        .to(cardRef.current, {
          keyframes: [
            { x: -10, duration: 0.06 }, { x: 10,  duration: 0.06 },
            { x: -7,  duration: 0.06 }, { x: 7,   duration: 0.06 },
            { x: -3,  duration: 0.06 }, { x: 0,   duration: 0.06 },
          ],
        })
        .to(cardRef.current, { borderColor: 'rgba(176,64,48,0.35)', duration: 0.15 }, '<')
        .to(cardRef.current, { borderColor: C.border, duration: 0.5, delay: 0.3 });

      setServerError(
        err.code === 'auth/invalid-credential'
          ? 'Incorrect email or password. Please try again.'
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
      const userDoc  = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid, email: result.user.email,
          displayName: result.user.displayName || '',
          username: result.user.email.split('@')[0],
          photoURL: result.user.photoURL || '',
          role: 'reader', genres: [], readingMood: 'just-browsing',
          isPublic: true, connections: [], onboardingComplete: false,
          createdAt: Date.now(),
        });
        gsap.to(pageRef.current, { opacity: 0, duration: 0.4, onComplete: () => navigate('/quiz') });
      } else {
        const dest = userDoc.data().onboardingComplete ? '/home' : '/quiz';
        gsap.to(pageRef.current, { opacity: 0, duration: 0.4, onComplete: () => navigate(dest) });
      }
    } catch {
      setServerError('Google sign-in failed. Please try again.');
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

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div ref={badgeRef} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '68px', height: '68px', borderRadius: '20px',
            background: `linear-gradient(145deg, #fffaf3, #f5ead8)`,
            border: `1px solid rgba(176,106,16,0.25)`,
            position: 'relative', marginBottom: '1.4rem',
            boxShadow: '0 8px 28px rgba(0,0,0,0.1), 0 2px 6px rgba(176,106,16,0.12)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={C.amber} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={C.amber} strokeWidth="1.6" strokeLinejoin="round"/>
              <line x1="9" y1="7" x2="15" y2="7" stroke={C.amberGlow} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
              <line x1="9" y1="10.5" x2="13" y2="10.5" stroke={C.amberGlow} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
            </svg>
            {[{ top:6, right:6, bT:true, bR:true }, { bottom:6, left:6, bB:true, bL:true }].map((p, i) => (
              <div key={i} style={{
                position:'absolute', top:p.top, right:p.right, bottom:p.bottom, left:p.left,
                width:6, height:6,
                borderTop:    p.bT ? `1.5px solid rgba(176,106,16,0.4)` : 'none',
                borderRight:  p.bR ? `1.5px solid rgba(176,106,16,0.4)` : 'none',
                borderBottom: p.bB ? `1.5px solid rgba(176,106,16,0.4)` : 'none',
                borderLeft:   p.bL ? `1.5px solid rgba(176,106,16,0.4)` : 'none',
              }}/>
            ))}
          </div>

          <div ref={headRef}>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5.5vw, 1.9rem)', fontWeight: 800,
              color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.3rem',
            }}>
              Sign in to BookChat
            </h1>
          </div>
          <div ref={subRef}>
            <p style={{ color: C.textMuted, fontSize: '0.83rem', letterSpacing: '0.02em' }}>
              Your library awaits
            </p>
          </div>
        </div>

        {/* Ornament */}
        <div ref={ornRef} style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'1.75rem' }}>
          <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg, transparent, rgba(176,106,16,0.25))` }}/>
          <span style={{ color:'rgba(176,106,16,0.4)', fontSize:'0.55rem', letterSpacing:'0.2em' }}>
            ✦ &nbsp; B O O K C H A T &nbsp; ✦
          </span>
          <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg, rgba(176,106,16,0.25), transparent)` }}/>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: '22px',
            padding: 'clamp(1.5rem, 6vw, 2.25rem)',
            boxShadow: '0 12px 50px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Card top shimmer */}
          <div style={{
            position:'absolute', top:0, left:'15%', right:'15%', height:'1px',
            background:`linear-gradient(90deg, transparent, rgba(176,106,16,0.25), transparent)`,
          }}/>

          {/* Google */}
          <MagneticButton
            onClick={handleGoogle} disabled={gLoading}
            style={{
              width:'100%',
              background: 'rgba(0,0,0,0.025)',
              color: C.textSub,
              border: `1px solid rgba(0,0,0,0.1)`,
              borderRadius:'13px', padding:'13px 20px',
              fontFamily:'Gilroy, sans-serif', fontSize:'0.9rem', fontWeight:600,
              cursor: gLoading ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              gap:'10px', marginBottom:'1.5rem', letterSpacing:'0.01em',
              transition:'all 0.2s', opacity: gLoading ? 0.6 : 1,
              position:'relative', overflow:'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <motion.div
              style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent, rgba(0,0,0,0.02) 50%, transparent)' }}
              initial={{ x:'-100%' }} whileHover={{ x:'100%' }} transition={{ duration:0.5 }}
            />
            {gLoading
              ? <Loader2 size={16} style={{ animation:'bc-spin 1s linear infinite' }}/>
              : <svg width="17" height="17" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
            }
            Continue with Google
          </MagneticButton>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1.5rem' }}>
            <div style={{ flex:1, height:'1px', background:`rgba(0,0,0,0.08)` }}/>
            <span style={{ color:C.textFaint, fontSize:'0.68rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>
              or email
            </span>
            <div style={{ flex:1, height:'1px', background:`rgba(0,0,0,0.08)` }}/>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <PremiumInput
              label="Email Address" name="email" type="email" placeholder="you@example.com"
              value={values.email} onChange={handleChange} onBlur={handleBlur}
              error={errors.email} touched={touched.email}
            />
            <PremiumInput
              label="Password" name="password" type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              value={values.password} onChange={handleChange} onBlur={handleBlur}
              error={errors.password} touched={touched.password}
              suffix={
                <motion.button type="button" onClick={() => setShowPass(p => !p)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ background:'none', border:'none', color:C.textFaint, cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', transition:'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.amber}
                  onMouseLeave={e => e.currentTarget.style.color = C.textFaint}
                >
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </motion.button>
              }
            />

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity:0, y:-8, scale:0.97 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  exit={{ opacity:0, scale:0.97 }}
                  style={{
                    background: C.errorBg, border:`1px solid ${C.errorBorder}`,
                    borderRadius:'10px', padding:'11px 15px', color:C.error,
                    fontSize:'0.78rem', marginBottom:'1.1rem',
                    display:'flex', alignItems:'center', gap:'8px',
                  }}
                >
                  <span>⚠</span> {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign In Button */}
            <MagneticButton
              type="submit" disabled={loading || success}
              style={{
                width:'100%',
                background: success
                  ? 'linear-gradient(135deg, #3a8a28, #4aa034)'
                  : `linear-gradient(135deg, #7a4800 0%, ${C.amber} 45%, ${C.amberLight} 100%)`,
                color: '#fff8ee',
                border: `1px solid ${success ? 'rgba(60,140,40,0.4)' : 'rgba(176,106,16,0.3)'}`,
                borderRadius:'13px', padding:'15px 24px',
                fontFamily:'Gilroy, sans-serif', fontSize:'0.95rem', fontWeight:700,
                cursor:(loading||success) ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                letterSpacing:'0.04em',
                boxShadow:(loading||success) ? 'none' : `0 4px 20px rgba(176,106,16,0.35), inset 0 1px 0 rgba(255,255,255,0.15)`,
                transition:'all 0.3s', opacity:loading ? 0.75 : 1,
                position:'relative', overflow:'hidden',
              }}
            >
              {!loading && !success && (
                <motion.div
                  style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)' }}
                  initial={{ x:'-100%' }} whileHover={{ x:'100%' }} transition={{ duration:0.5 }}
                />
              )}
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.span key="s" initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }}
                    style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    ✓ &nbsp;Signed in
                  </motion.span>
                ) : loading ? (
                  <motion.span key="l" initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <Loader2 size={16} style={{ animation:'bc-spin 1s linear infinite' }}/> Signing in...
                  </motion.span>
                ) : (
                  <motion.span key="i" initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    Sign In &nbsp;<ArrowRight size={15} strokeWidth={2.5}/>
                  </motion.span>
                )}
              </AnimatePresence>
            </MagneticButton>
          </form>

          {/* Footer */}
          <div style={{ marginTop:'1.75rem', paddingTop:'1.5rem', borderTop:`1px solid rgba(0,0,0,0.06)`, textAlign:'center' }}>
            <p style={{ color:C.textMuted, fontSize:'0.85rem' }}>
              New to BookChat?{' '}
              <Link to="/register"
                style={{ color:C.amber, textDecoration:'none', fontWeight:700 }}
                onMouseEnter={e => e.currentTarget.style.color = C.amberLight}
                onMouseLeave={e => e.currentTarget.style.color = C.amber}
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Card bottom shimmer */}
          <div style={{
            position:'absolute', bottom:0, left:'20%', right:'20%', height:'1px',
            background:`linear-gradient(90deg, transparent, rgba(176,106,16,0.2), transparent)`,
          }}/>
        </div>

        {/* Tagline */}
        <div ref={footRef} style={{ textAlign:'center', marginTop:'1.75rem' }}>
          <p style={{ color:C.textFaint, fontSize:'0.65rem', letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:600 }}>
            Where Readers Meet &nbsp;✦&nbsp; Quietly
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bc-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px ${C.bgInputFocus} inset !important;
          -webkit-text-fill-color: ${C.text} !important;
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}