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
import { Eye, EyeOff, Loader2, ArrowRight, Check } from 'lucide-react';

// ── Password Strength ─────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Symbol', ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const META = [
    { label: 'Weak',   color: '#c05040', bg: 'rgba(192,80,64,0.12)' },
    { label: 'Fair',   color: '#c47a1e', bg: 'rgba(196,122,30,0.12)' },
    { label: 'Good',   color: '#4a8a2a', bg: 'rgba(74,138,42,0.12)' },
    { label: 'Strong', color: '#2a7a5a', bg: 'rgba(42,122,90,0.12)' },
  ];
  const m = META[score - 1] || META[0];
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 8, marginBottom: 4 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0,1,2,3].map(i => (
          <motion.div key={i} animate={{ background: i < score ? m.color : 'rgba(196,122,30,0.1)' }}
            style={{ flex: 1, height: 3, borderRadius: 2, transition: 'background 0.3s' }}/>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {checks.map((c, i) => (
            <span key={i} style={{ fontSize: '0.66rem', color: c.ok ? '#4a8a2a' : '#9a8870', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Gilroy, sans-serif', transition: 'color 0.2s' }}>
              <motion.span animate={{ scale: c.ok ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.2 }}>
                {c.ok ? '✓' : '○'}
              </motion.span>
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: m.color, background: m.bg, padding: '2px 8px', borderRadius: 20, fontFamily: 'Gilroy, sans-serif' }}>
            {m.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Magnetic Button ───────────────────────────────────────────────────────────
function MagBtn({ children, onClick, disabled, style, type = 'button' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18 });
  const sy = useSpring(y, { stiffness: 180, damping: 18 });
  return (
    <motion.button ref={ref} type={type} disabled={disabled} onClick={onClick}
      style={{ x: sx, y: sy, ...style }}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onMouseMove={e => {
        if (disabled) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.22);
        y.set((e.clientY - r.top - r.height / 2) * 0.22);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.button>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, name, type = 'text', placeholder, value, onChange, onBlur, error, touched, suffix, prefix, hint, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const hasErr = touched && error;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <motion.label animate={{ color: hasErr ? '#b05040' : focused ? '#c47a1e' : '#6a5840' }}
        style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: 7, fontFamily: 'Gilroy, sans-serif' }}>
        {label}
      </motion.label>
      <div style={{ position: 'relative' }}>
        <AnimatePresence>
          {focused && (
            <motion.div key="ring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: -2, borderRadius: 13, background: hasErr ? 'rgba(180,80,60,0.03)' : 'rgba(196,122,30,0.03)', border: `1.5px solid ${hasErr ? 'rgba(180,80,60,0.3)' : 'rgba(196,122,30,0.4)'}`, pointerEvents: 'none', zIndex: 0 }}/>
          )}
        </AnimatePresence>
        {prefix && <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, color: focused ? '#c47a1e' : '#9a8070', fontSize: '0.88rem', fontWeight: 700, transition: 'color 0.2s', fontFamily: 'Gilroy, sans-serif' }}>{prefix}</div>}
        <input name={name} type={type} placeholder={placeholder} value={value}
          autoComplete={autoComplete || (name === 'password' || name === 'confirmPassword' ? 'new-password' : name === 'email' ? 'email' : 'off')}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={e => { setFocused(false); onBlur(e); }}
          style={{
            position: 'relative', zIndex: 1, width: '100%',
            background: focused ? '#fffdf8' : '#f5f0e8',
            border: `1px solid ${hasErr ? 'rgba(180,80,60,0.4)' : focused ? 'rgba(196,122,30,0.45)' : 'rgba(196,122,30,0.18)'}`,
            borderRadius: 11,
            padding: `12px ${suffix ? '42px' : '16px'} 12px ${prefix ? '30px' : '16px'}`,
            color: '#1a1208', fontFamily: 'Gilroy, sans-serif',
            fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(196,122,30,0.06), 0 2px 10px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.04)',
          }}
        />
        {suffix && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>{suffix}</div>}
        <motion.div animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', bottom: 0, left: 12, right: 12, height: 1, zIndex: 2, transformOrigin: 'center', background: hasErr ? 'linear-gradient(90deg,transparent,#b05040,transparent)' : 'linear-gradient(90deg,transparent,#c47a1e 30%,#f0b84a 50%,#c47a1e 70%,transparent)' }}/>
      </div>
      <AnimatePresence mode="wait">
        {hasErr && (
          <motion.p key="e" initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ color: '#b05040', fontSize: '0.68rem', marginTop: 5, paddingLeft: 2, fontFamily: 'Gilroy, sans-serif' }}>
            {error}
          </motion.p>
        )}
        {hint && !hasErr && (
          <motion.p key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ color: '#9a8870', fontSize: '0.67rem', marginTop: 5, paddingLeft: 2, fontStyle: 'italic', fontFamily: 'Gilroy, sans-serif' }}>
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pledge ────────────────────────────────────────────────────────────────────
function Pledge({ accepted, onToggle }) {
  return (
    <motion.div onClick={onToggle} whileHover={{ borderColor: 'rgba(196,122,30,0.45)' }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 15px', background: accepted ? 'rgba(196,122,30,0.06)' : '#f5f0e8', border: `1px solid ${accepted ? 'rgba(196,122,30,0.35)' : 'rgba(196,122,30,0.15)'}`, borderRadius: 12, cursor: 'pointer', marginBottom: '1.1rem', transition: 'all 0.2s' }}>
      <motion.div animate={{ background: accepted ? '#c47a1e' : 'transparent', borderColor: accepted ? '#c47a1e' : 'rgba(196,122,30,0.4)' }}
        style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <AnimatePresence>
          {accepted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={10} color="#fff" strokeWidth={3}/></motion.div>}
        </AnimatePresence>
      </motion.div>
      <p style={{ fontSize: '0.77rem', color: '#3a2e20', lineHeight: 1.55, fontFamily: 'Gilroy, sans-serif' }}>
        I pledge to keep BookChat thoughtful, kind, and centered around <span style={{ color: '#c47a1e', fontWeight: 700 }}>genuine love for books & writing</span>.
      </p>
    </motion.div>
  );
}

// ── Background ────────────────────────────────────────────────────────────────
function Bg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#faf6ef' }}/>
      <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-20%', left: '-15%', width: '65vw', height: '65vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,122,30,0.08) 0%,transparent 65%)' }}/>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{ position: 'absolute', bottom: '-25%', right: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(160,100,10,0.06) 0%,transparent 60%)' }}/>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(196,122,30,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(196,122,30,0.03) 1px,transparent 1px)', backgroundSize: '52px 52px' }}/>
      {/* Floating symbols */}
      {['📖','✦','📚','✒️','📕','◆','📗','◇','📘','✧'].map((s, i) => (
        <motion.div key={i}
          initial={{ x: `${10 + i * 9}vw`, y: '110vh', opacity: 0, rotate: 0 }}
          animate={{ y: '-10vh', opacity: [0, 0.1, 0.07, 0], rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 22 + i * 3, repeat: Infinity, delay: i * 2.2, ease: 'linear' }}
          style={{ position: 'absolute', fontSize: `${0.7 + (i % 3) * 0.4}rem`, color: '#c47a1e', pointerEvents: 'none' }}>
          {s}
        </motion.div>
      ))}
    </div>
  );
}

// ── STEP INDICATOR ────────────────────────────────────────────────────────────
function StepDots({ step, total }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i}
          animate={{ width: i === step ? 24 : 7, background: i === step ? '#c47a1e' : i < step ? 'rgba(196,122,30,0.4)' : 'rgba(196,122,30,0.15)' }}
          style={{ height: 7, borderRadius: 4, transition: 'background 0.3s' }}/>
      ))}
    </div>
  );
}

// ─── REGISTER PAGE ────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const pageRef  = useRef(null);
  const cardRef  = useRef(null);

  // Two-step form: step 0 = basic info, step 1 = account details
  const [step, setStep]           = useState(0);
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [pledged, setPledged]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);
  const [svrErr, setSvrErr]       = useState('');
  const [success, setSuccess]     = useState(false);

  const [vals, setVals] = useState({
    displayName: '', username: '', email: '',
    dob: '', password: '', confirmPassword: '',
  });
  const [errs, setErrs]     = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    }
  }, []);

  const validate = (data, fields) => {
    const e = {};
    if (!fields || fields.includes('displayName')) {
      if (!data.displayName) e.displayName = 'Full name is required';
      else if (data.displayName.trim().length < 2) e.displayName = 'At least 2 characters';
    }
    if (!fields || fields.includes('dob')) {
      if (!data.dob) e.dob = 'Date of birth is required';
      else {
        const d = new Date(data.dob);
        const age = (Date.now() - d) / (365.25 * 24 * 3600 * 1000);
        if (isNaN(d)) e.dob = 'Invalid date';
        else if (age < 13) e.dob = 'Must be at least 13 years old';
      }
    }
    if (!fields || fields.includes('username')) {
      if (!data.username) e.username = 'Username is required';
      else if (data.username.length < 3) e.username = 'At least 3 characters';
      else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) e.username = 'Letters, numbers, underscores only';
    }
    if (!fields || fields.includes('email')) {
      if (!data.email) e.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(data.email)) e.email = 'Enter a valid email';
    }
    if (!fields || fields.includes('password')) {
      if (!data.password) e.password = 'Password is required';
      else if (data.password.length < 8) e.password = 'At least 8 characters';
      else if (!/[A-Z]/.test(data.password)) e.password = 'Add an uppercase letter';
      else if (!/[0-9]/.test(data.password)) e.password = 'Add a number';
    }
    if (!fields || fields.includes('confirmPassword')) {
      if (!data.confirmPassword) e.confirmPassword = 'Please confirm your password';
      else if (data.confirmPassword !== data.password) e.confirmPassword = 'Passwords do not match';
    }
    return e;
  };

  const onChange = e => {
    const { name, value } = e.target;
    setVals(p => ({ ...p, [name]: value }));
    if (touched[name]) {
      const e2 = validate({ ...vals, [name]: value }, [name]);
      setErrs(p => ({ ...p, [name]: e2[name] || '' }));
    }
  };

  const onBlur = e => {
    const { name } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    const e2 = validate(vals, [name]);
    setErrs(p => ({ ...p, [name]: e2[name] || '' }));
  };

  const shake = () => gsap.to(cardRef.current, { keyframes: [{ x: -8 }, { x: 8 }, { x: -5 }, { x: 5 }, { x: 0 }], duration: 0.35 });

  const nextStep = () => {
    const step0Fields = ['displayName', 'dob', 'username', 'email'];
    const e = validate(vals, step0Fields);
    const t = {};
    step0Fields.forEach(f => (t[f] = true));
    setTouched(p => ({ ...p, ...t }));
    setErrs(p => ({ ...p, ...e }));
    const step0Errors = step0Fields.filter(f => e[f]);
    if (step0Errors.length > 0) { shake(); return; }
    setStep(1);
    gsap.fromTo(cardRef.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
  };

  const onSubmit = async e => {
    e.preventDefault();
    if (!pledged) { setSvrErr('Please accept the community pledge.'); shake(); return; }
    const allErrs = validate(vals);
    setErrs(allErrs);
    setTouched({ displayName: true, dob: true, username: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(allErrs).length > 0) { shake(); return; }

    setLoading(true);
    setSvrErr('');
    try {
      const q = query(collection(db, 'users'), where('username', '==', vals.username.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) { setErrs(p => ({ ...p, username: 'Username already taken' })); setLoading(false); setStep(0); return; }

      const cred = await createUserWithEmailAndPassword(auth, vals.email, vals.password);
      await updateProfile(cred.user, { displayName: vals.displayName });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        displayName: vals.displayName,
        username: vals.username.toLowerCase(),
        email: vals.email,
        dob: vals.dob,
        photoURL: '',
        bio: '',
        role: null,           // set in profile
        badge: null,          // earned badge
        genres: [],
        feedPrefs: {},
        privacyMode: 'public',
        followers: [], following: [],
        onboardingComplete: false,
        createdAt: Date.now(),
      });
      setSuccess(true);
      gsap.to(pageRef.current, { opacity: 0, duration: 0.5, delay: 0.6, onComplete: () => navigate('/quiz') });
    } catch (err) {
      shake();
      setSvrErr(err.code === 'auth/email-already-in-use' ? 'An account with this email already exists.' : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGLoading(true); setSvrErr('');
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      await setDoc(doc(db, 'users', res.user.uid), {
        uid: res.user.uid, displayName: res.user.displayName || '',
        username: res.user.email.split('@')[0], email: res.user.email,
        dob: '', photoURL: res.user.photoURL || '', bio: '',
        role: null, badge: null, genres: [], feedPrefs: {},
        privacyMode: 'public', followers: [], following: [],
        onboardingComplete: false, createdAt: Date.now(),
      }, { merge: true });
      gsap.to(pageRef.current, { opacity: 0, duration: 0.4, onComplete: () => navigate('/quiz') });
    } catch { setSvrErr('Google sign-up failed. Please try again.'); setGLoading(false); }
  };

  const eyeBtn = (show, setShow) => (
    <motion.button type="button" onClick={() => setShow(p => !p)}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      style={{ background: 'none', border: 'none', color: '#8a7560', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.color = '#c47a1e'}
      onMouseLeave={e => e.currentTarget.style.color = '#8a7560'}>
      {show ? <EyeOff size={15}/> : <Eye size={15}/>}
    </motion.button>
  );

  return (
    <div ref={pageRef} style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
      <Bg/>
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <motion.div whileHover={{ rotate: [-6, 6, 0] }} transition={{ duration: 0.4 }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 62, height: 62, borderRadius: 20, background: 'linear-gradient(145deg,#fff,#f5f0e8)', border: '1px solid rgba(196,122,30,0.25)', boxShadow: '0 8px 32px rgba(196,122,30,0.12)', marginBottom: '1.1rem', position: 'relative' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#c47a1e" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#c47a1e" strokeWidth="1.6"/>
              <line x1="9" y1="7" x2="15" y2="7" stroke="#e8a94a" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
              <line x1="9" y1="10.5" x2="13" y2="10.5" stroke="#e8a94a" strokeWidth="1.3" strokeLinecap="round" opacity="0.55"/>
            </svg>
            {/* Corner accents */}
            <div style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderTop: '1.5px solid rgba(196,122,30,0.5)', borderRight: '1.5px solid rgba(196,122,30,0.5)' }}/>
            <div style={{ position: 'absolute', bottom: 7, left: 7, width: 6, height: 6, borderBottom: '1.5px solid rgba(196,122,30,0.5)', borderLeft: '1.5px solid rgba(196,122,30,0.5)' }}/>
          </motion.div>
          <h1 style={{ fontSize: 'clamp(1.45rem,5vw,1.75rem)', fontWeight: 800, color: '#1a1208', letterSpacing: '-0.025em', marginBottom: 4, lineHeight: 1.1, fontFamily: 'Gilroy, sans-serif' }}>
            Join BookChat
          </h1>
          <p style={{ color: '#8a7560', fontSize: '0.81rem', fontFamily: 'Gilroy, sans-serif' }}>
            A home for readers &amp; writers
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(196,122,30,0.22))' }}/>
          <span style={{ color: 'rgba(196,122,30,0.5)', fontSize: '0.54rem', letterSpacing: '0.2em' }}>✦ &nbsp;BOOKCHAT&nbsp; ✦</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(196,122,30,0.22),transparent)' }}/>
        </div>

        {/* Card */}
        <div ref={cardRef} style={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(196,122,30,0.11)', borderRadius: 22, padding: 'clamp(1.4rem,5vw,2.1rem)', boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 4px 14px rgba(196,122,30,0.06)', position: 'relative', overflow: 'hidden' }}>
          {/* Top shimmer line */}
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(196,122,30,0.2),transparent)' }}/>

          <StepDots step={step} total={2}/>

          {/* Google signup (only step 0) */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="google" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MagBtn onClick={handleGoogle} disabled={gLoading}
                  style={{ width: '100%', background: '#f8f4ed', color: '#3a2e20', border: '1px solid rgba(196,122,30,0.18)', borderRadius: 12, padding: '12px 20px', fontFamily: 'Gilroy, sans-serif', fontSize: '0.87rem', fontWeight: 600, cursor: gLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.4rem', transition: 'all 0.2s', opacity: gLoading ? 0.6 : 1, position: 'relative', overflow: 'hidden' }}>
                  <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(196,122,30,0.05),transparent)' }} initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.5 }}/>
                  {gLoading
                    ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/>
                    : <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  }
                  Continue with Google
                </MagBtn>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.4rem' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(196,122,30,0.1)' }}/>
                  <span style={{ color: '#b0a090', fontSize: '0.67rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'Gilroy, sans-serif' }}>or with email</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(196,122,30,0.1)' }}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="s0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {/* Step 0: Personal info */}
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c47a1e', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.9rem' }}>👤</span> Personal Info
                  </p>
                </div>

                <Field label="Full Name" name="displayName" placeholder="Your full name"
                  value={vals.displayName} onChange={onChange} onBlur={onBlur}
                  error={errs.displayName} touched={touched.displayName}
                  hint="This is displayed on your profile"/>

                <Field label="Date of Birth" name="dob" type="date" placeholder=""
                  value={vals.dob} onChange={onChange} onBlur={onBlur}
                  error={errs.dob} touched={touched.dob}
                  hint="We'll wish you on your birthday 🎂"/>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Username" name="username" placeholder="bookworm"
                    value={vals.username} onChange={onChange} onBlur={onBlur}
                    error={errs.username} touched={touched.username}
                    prefix="@" hint="Unique handle"/>
                  <Field label="Email" name="email" type="email" placeholder="you@example.com"
                    value={vals.email} onChange={onChange} onBlur={onBlur}
                    error={errs.email} touched={touched.email} autoComplete="email"/>
                </div>

                <MagBtn type="button" onClick={nextStep}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#7a4800,#b87018,#d49030,#e8a840)', color: '#fdf0e0', border: '1px solid rgba(196,122,30,0.2)', borderRadius: 13, padding: '14px 24px', fontFamily: 'Gilroy, sans-serif', fontSize: '0.93rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.04em', boxShadow: '0 6px 24px rgba(196,122,30,0.28), inset 0 1px 0 rgba(255,255,255,0.15)', position: 'relative', overflow: 'hidden', marginTop: 4 }}>
                  <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.5 }}/>
                  Continue <ArrowRight size={15} strokeWidth={2.5}/>
                </MagBtn>
              </motion.div>
            ) : (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                {/* Step 1: Account security */}
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c47a1e', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.9rem' }}>🔒</span> Set Your Password
                  </p>
                </div>

                <form onSubmit={onSubmit} noValidate>
                  <Field label="Password" name="password" type={showPass ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={vals.password} onChange={onChange} onBlur={onBlur}
                    error={errs.password} touched={touched.password}
                    suffix={eyeBtn(showPass, setShowPass)}/>
                  {vals.password && <PasswordStrength password={vals.password}/>}
                  <div style={{ marginTop: vals.password ? 10 : 0 }}>
                    <Field label="Confirm Password" name="confirmPassword" type={showConf ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={vals.confirmPassword} onChange={onChange} onBlur={onBlur}
                      error={errs.confirmPassword} touched={touched.confirmPassword}
                      suffix={eyeBtn(showConf, setShowConf)}/>
                  </div>

                  {/* Info card */}
                  <div style={{ background: 'rgba(196,122,30,0.05)', border: '1px solid rgba(196,122,30,0.12)', borderRadius: 10, padding: '11px 13px', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.73rem', color: '#7a5a30', lineHeight: 1.5, fontFamily: 'Gilroy, sans-serif' }}>
                      <span style={{ fontWeight: 700 }}>✦ You're almost in!</span> After signup, you'll set your reading/writing preferences to personalize your feed. You can also choose a <span style={{ color: '#c47a1e', fontWeight: 700 }}>Reader, Writer, or Author badge</span> from your profile page anytime.
                    </p>
                  </div>

                  <Pledge accepted={pledged} onToggle={() => setPledged(p => !p)}/>

                  <AnimatePresence>
                    {svrErr && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: 'rgba(180,80,60,0.06)', border: '1px solid rgba(180,80,60,0.2)', borderRadius: 10, padding: '10px 14px', color: '#b05040', fontSize: '0.77rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Gilroy, sans-serif' }}>
                        <span>⚠</span> {svrErr}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 10 }}>
                    <motion.button type="button" onClick={() => setStep(0)} whileTap={{ scale: 0.96 }}
                      style={{ background: '#f0ebe0', border: '1px solid rgba(196,122,30,0.18)', borderRadius: 13, padding: '14px', fontFamily: 'Gilroy, sans-serif', fontSize: '0.88rem', fontWeight: 600, color: '#7a5a30', cursor: 'pointer' }}>
                      ←
                    </motion.button>
                    <MagBtn type="submit" disabled={loading || success}
                      style={{ background: success ? 'linear-gradient(135deg,#2a6a1a,#3a8a22)' : 'linear-gradient(135deg,#7a4800,#b87018,#d49030,#e8a840)', color: '#fdf0e0', border: 'none', borderRadius: 13, padding: '14px 20px', fontFamily: 'Gilroy, sans-serif', fontSize: '0.93rem', fontWeight: 700, cursor: (loading || success) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.04em', boxShadow: (loading || success) ? 'none' : '0 6px 24px rgba(196,122,30,0.28), inset 0 1px 0 rgba(255,255,255,0.15)', opacity: loading ? 0.75 : 1, position: 'relative', overflow: 'hidden' }}>
                      <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.5 }}/>
                      <AnimatePresence mode="wait">
                        {success ? (
                          <motion.span key="s" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            ✓ Account created!
                          </motion.span>
                        ) : loading ? (
                          <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }}/> Creating...
                          </motion.span>
                        ) : (
                          <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            Create Account <ArrowRight size={15} strokeWidth={2.5}/>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </MagBtn>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign in link */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(196,122,30,0.07)', textAlign: 'center' }}>
            <p style={{ color: '#8a7560', fontSize: '0.82rem', fontFamily: 'Gilroy, sans-serif' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#c47a1e', textDecoration: 'none', fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.color = '#d49030'}
                onMouseLeave={e => e.currentTarget.style.color = '#c47a1e'}>
                Sign in
              </Link>
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(196,122,30,0.14),transparent)' }}/>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: '#c0b090', fontSize: '0.63rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'Gilroy, sans-serif' }}>
            Where Readers Meet &nbsp;✦&nbsp; Quietly
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: opacity(0.4); cursor: pointer; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #f5f0e8 inset !important; -webkit-text-fill-color: #1a1208 !important; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      `}</style>
    </div>
  );
}