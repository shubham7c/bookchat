import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import {
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc, getDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import BottomNav from '../components/shared/BottomNav';
import {
  LogOut, Trash2, Edit3, Check, X, Camera,
  Shield, Eye, EyeOff, ChevronRight, Settings,
  BookOpen, PenLine, Award, Star, Globe, Lock, Users,
  Grid, List, Bookmark
} from 'lucide-react';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { useThemeStore } from '../store/themeStore';

// ─── BADGE CONFIG ─────────────────────────────────────────────────────────────
const BADGES = {
  reader: {
    label: 'Reader',
    emoji: '📖',
    gradient: 'linear-gradient(135deg, #c47a1e, #e8a840, #f0c060, #e8a840, #c47a1e)',
    glow: 'rgba(196,122,30,0.55)',
    border: 'rgba(196,122,30,0.7)',
    desc: 'Passionate reader',
  },
  writer: {
    label: 'Writer',
    emoji: '✒️',
    gradient: 'linear-gradient(135deg, #6b3fa0, #9b6fd0, #b890e8, #9b6fd0, #6b3fa0)',
    glow: 'rgba(107,63,160,0.5)',
    border: 'rgba(147,103,200,0.7)',
    desc: 'Creative writer',
  },
  both: {
    label: 'Reader & Writer',
    emoji: '📚',
    gradient: 'linear-gradient(135deg, #c47a1e, #9b6fd0, #c47a1e)',
    glow: 'rgba(150,90,90,0.45)',
    border: 'rgba(180,120,100,0.7)',
    desc: 'Reader & Writer',
  },
  author: {
    label: 'Published Author',
    emoji: '🏆',
    gradient: 'linear-gradient(135deg, #8b0000, #d4182a, #ff6b35, #d4182a, #8b0000)',
    glow: 'rgba(212,24,42,0.55)',
    border: 'rgba(220,50,50,0.7)',
    desc: 'Published Author',
  },
};

// ─── SHINY BADGE ──────────────────────────────────────────────────────────────
function ShinyBadge({ type, size = 'md', showLabel = true }) {
  const b = BADGES[type];
  if (!b) return null;
  const dim = size === 'lg' ? 72 : size === 'sm' ? 36 : 50;
  const fontSize = size === 'lg' ? '1.8rem' : size === 'sm' ? '1rem' : '1.35rem';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <motion.div
        whileHover={{ scale: 1.08, rotate: [-2, 2, 0] }}
        transition={{ duration: 0.3 }}
        style={{ position: 'relative' }}
      >
        {/* Glow */}
        <motion.div
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.12, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            background: `radial-gradient(circle, ${b.glow}, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Badge circle */}
        <div style={{
          width: dim, height: dim, borderRadius: '50%',
          background: b.gradient,
          backgroundSize: '200% 200%',
          border: `2px solid ${b.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize, position: 'relative', overflow: 'hidden',
          boxShadow: `0 4px 20px ${b.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}>
          {/* Shine sweep */}
          <motion.div
            animate={{ x: ['-120%', '200%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)',
              pointerEvents: 'none',
            }}
          />
          {b.emoji}
        </div>
        {/* Sparkle dots */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <motion.div key={i}
            animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.33, ease: 'easeInOut' }}
            style={{
              position: 'absolute', width: 3, height: 3, borderRadius: '50%',
              background: 'rgba(255,255,255,0.8)',
              top: '50%', left: '50%',
              transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${dim / 2 + 5}px)`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </motion.div>
      {showLabel && (
        <span style={{
          fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif',
          background: b.gradient, WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', backgroundSize: '200%',
        }}>
          {b.label}
        </span>
      )}
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHead({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--bc-text-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Gilroy, sans-serif' }}>
        {title}
      </span>
      {action}
    </div>
  );
}

// ─── EDIT FIELD INLINE ────────────────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder, multiline = false, maxLen = 120 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  if (!editing) return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ flex: 1, fontSize: '0.88rem', color: value ? 'var(--bc-text-primary)' : 'var(--bc-text-faint)', fontFamily: 'Gilroy, sans-serif', lineHeight: 1.6, fontStyle: value ? 'normal' : 'italic' }}>
        {value || placeholder}
      </span>
      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
        onClick={() => { setDraft(value || ''); setEditing(true); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bc-amber)', padding: 3, flexShrink: 0, display: 'flex' }}>
        <Edit3 size={14} strokeWidth={2}/>
      </motion.button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {multiline
        ? <textarea ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} maxLength={maxLen} rows={3}
            style={{ width: '100%', background: 'var(--bc-bg-input-focus)', border: '1.5px solid var(--bc-border-focus)', borderRadius: 10, padding: '10px 12px', color: 'var(--bc-text-primary)', fontFamily: 'Gilroy, sans-serif', fontSize: '0.88rem', outline: 'none', resize: 'none', lineHeight: 1.55, boxShadow: '0 0 0 3px rgba(196,122,30,0.07)' }}/>
        : <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} maxLength={maxLen}
            style={{ width: '100%', background: 'var(--bc-bg-input-focus)', border: '1.5px solid var(--bc-border-focus)', borderRadius: 10, padding: '10px 12px', color: 'var(--bc-text-primary)', fontFamily: 'Gilroy, sans-serif', fontSize: '0.88rem', outline: 'none', boxShadow: '0 0 0 3px rgba(196,122,30,0.07)' }}/>
      }
      {maxLen && <div style={{ textAlign: 'right', fontSize: '0.62rem', color: 'var(--bc-text-faint)', fontFamily: 'Gilroy, sans-serif' }}>{draft.length}/{maxLen}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button onClick={save} whileTap={{ scale: 0.95 }}
          style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'linear-gradient(135deg,#c47a1e,#e8a840)', border: 'none', color: '#fff', fontFamily: 'Gilroy, sans-serif', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Check size={13} strokeWidth={2.5}/> Save
        </motion.button>
        <motion.button onClick={() => setEditing(false)} whileTap={{ scale: 0.95 }}
          style={{ padding: '9px 14px', borderRadius: 10, background: 'var(--bc-bg-chip)', border: '1px solid var(--bc-border)', color: 'var(--bc-text-muted)', fontFamily: 'Gilroy, sans-serif', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <X size={13}/>
        </motion.button>
      </div>
    </div>
  );
}

// ─── BADGE PICKER MODAL ───────────────────────────────────────────────────────
function BadgePicker({ current, onSelect, onClose }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(10,7,3,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 500, background: isDark ? '#171208' : '#fffdf6', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', boxShadow: isDark ? '0 -8px 40px rgba(0,0,0,0.7)' : '0 -8px 40px rgba(0,0,0,0.1)' }}>

        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(196,122,30,0.2)', margin: '0 auto 20px' }}/>

        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--bc-text-primary)', letterSpacing: '-0.02em', marginBottom: 5, fontFamily: 'Gilroy, sans-serif' }}>
          Choose Your Badge
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)', fontFamily: 'Gilroy, sans-serif', marginBottom: 22 }}>
          This appears on your profile. Choose what fits you best.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(BADGES).map(([key, b]) => (
            <motion.button key={key}
              whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}
              onClick={() => { onSelect(key); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                background: current === key ? 'rgba(196,122,30,0.07)' : 'var(--bc-bg-chip)',
                border: `1.5px solid ${current === key ? 'rgba(196,122,30,0.4)' : 'rgba(196,122,30,0.1)'}`,
                boxShadow: current === key ? '0 4px 16px rgba(196,122,30,0.1)' : 'none',
                transition: 'all 0.2s',
              }}>
              <ShinyBadge type={key} size="sm" showLabel={false}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--bc-text-primary)', fontFamily: 'Gilroy, sans-serif' }}>{b.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--bc-text-muted)', fontFamily: 'Gilroy, sans-serif' }}>{b.desc}</div>
              </div>
              {current === key && <Check size={16} color="#c47a1e" strokeWidth={2.5}/>}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel, extraField }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [val, setVal] = useState('');
  const [show, setShow] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(10,7,3,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 360, background: isDark ? '#171208' : '#fffdf6', borderRadius: 22, padding: '26px 22px', boxShadow: isDark ? '0 24px 80px rgba(0,0,0,0.75)' : '0 24px 80px rgba(0,0,0,0.15)' }}>

        <div style={{ fontSize: '2rem', marginBottom: 12, textAlign: 'center' }}>{danger ? '⚠️' : '✦'}</div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--bc-text-primary)', letterSpacing: '-0.02em', marginBottom: 8, fontFamily: 'Gilroy, sans-serif', textAlign: 'center' }}>{title}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--bc-text-muted)', lineHeight: 1.6, fontFamily: 'Gilroy, sans-serif', marginBottom: 18, textAlign: 'center' }}>{body}</p>

        {extraField && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--bc-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 7, fontFamily: 'Gilroy, sans-serif' }}>
              {extraField.label}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : extraField.type || 'text'}
                placeholder={extraField.placeholder}
                value={val} onChange={e => setVal(e.target.value)}
                style={{ width: '100%', background: 'var(--bc-bg-input)', border: '1px solid var(--bc-border-input)', borderRadius: 10, padding: '11px 40px 11px 14px', color: 'var(--bc-text-primary)', fontFamily: 'Gilroy, sans-serif', fontSize: '0.88rem', outline: 'none' }}
              />
              {extraField.type === 'password' && (
                <button type="button" onClick={() => setShow(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bc-text-muted)', display: 'flex' }}>
                  {show ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onCancel}
            style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--bc-bg-chip)', border: '1px solid var(--bc-border)', color: 'var(--bc-text-muted)', fontFamily: 'Gilroy, sans-serif', fontSize: '0.87rem', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onConfirm(val)}
            style={{ flex: 1, padding: '12px', borderRadius: 12, background: danger ? 'linear-gradient(135deg,#8b0000,#c01020)' : 'linear-gradient(135deg,#7a4800,#c47a1e)', border: 'none', color: '#fff', fontFamily: 'Gilroy, sans-serif', fontSize: '0.87rem', fontWeight: 700, cursor: 'pointer', boxShadow: danger ? '0 4px 16px rgba(180,20,20,0.3)' : '0 4px 16px rgba(196,122,30,0.3)' }}>
            {confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const pageRef = useRef(null);
  const fileRef = useRef(null);

  const [profileData, setProfileData]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Modals
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const [logoutConfirm,   setLogoutConfirm]   = useState(false);
  const [deleteConfirm,   setDeleteConfirm]   = useState(false);
  const [deleteErr,       setDeleteErr]       = useState('');

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (pageRef.current) gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!user?.uid) { setLoading(false); return; }
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setProfileData(snap.data());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const saveField = async (field, value) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), { [field]: value, updatedAt: Date.now() });
    setProfileData(p => ({ ...p, [field]: value }));
    setUser({ ...user, [field]: value });
  };

  // ── Photo upload ─────────────────────────────────────────────
  const handlePhotoChange = async e => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    setPhotoUploading(true);
    try {
      // For Firebase Storage upload — keeping as base64 preview for now
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result;
        await updateDoc(doc(db, 'users', user.uid), { photoURL: url, updatedAt: Date.now() });
        setProfileData(p => ({ ...p, photoURL: url }));
        setUser({ ...user, photoURL: url });
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch { setPhotoUploading(false); }
  };

  // ── Logout ───────────────────────────────────────────────────
  const doLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      gsap.to(pageRef.current, { opacity: 0, duration: 0.35, onComplete: () => navigate('/login') });
    } catch (e) { console.error(e); }
  };

  // ── Delete account ───────────────────────────────────────────
  const doDelete = async (password) => {
    if (!password) { setDeleteErr('Password is required to delete your account.'); return; }
    setDeleteErr('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) { setDeleteErr('Unable to re-authenticate. Please sign in again.'); return; }
      const cred = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, cred);
      await deleteDoc(doc(db, 'users', currentUser.uid));
      await deleteUser(currentUser);
      setUser(null);
      gsap.to(pageRef.current, { opacity: 0, duration: 0.35, onComplete: () => navigate('/register') });
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setDeleteErr('Wrong password. Account not deleted.');
      } else {
        setDeleteErr('Delete failed. Please try again.');
      }
    }
  };

  // ── Privacy label ────────────────────────────────────────────
  const privacyOpts = [
    { value: 'public',    label: 'Public',          icon: Globe,  desc: 'Everyone can see your activity' },
    { value: 'followers', label: 'Followers only',  icon: Users,  desc: 'Only your followers'            },
    { value: 'private',   label: 'Private',         icon: Lock,   desc: 'Only you'                      },
  ];
  const currentPrivacy = privacyOpts.find(p => p.value === (profileData?.privacyMode || 'public')) || privacyOpts[0];

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: isDark ? '#0f0d09' : '#faf6ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid rgba(196,122,30,0.15)', borderTop: '2.5px solid #c47a1e' }}/>
    </div>
  );

  return (
    <div ref={pageRef} style={{ minHeight: '100dvh', background: isDark ? '#0f0d09' : '#faf6ef', fontFamily: 'Gilroy, sans-serif' }}>

      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: isDark ? 'radial-gradient(circle,rgba(196,122,30,0.04) 0%,transparent 65%)' : 'radial-gradient(circle,rgba(196,122,30,0.07) 0%,transparent 65%)' }}/>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: isDark ? 'radial-gradient(circle,rgba(196,122,30,0.02) 0%,transparent 65%)' : 'radial-gradient(circle,rgba(196,122,30,0.04) 0%,transparent 65%)' }}/>
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto', padding: '20px 14px 100px' }}>

        {/* ── Header bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#c47a1e" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#c47a1e" strokeWidth="1.8"/>
            </svg>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--bc-text-primary)', letterSpacing: '-0.02em' }}>My Profile</span>
          </div>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => setSettingsOpen(true)}
            style={{ width: 38, height: 38, borderRadius: 13, background: 'rgba(196,122,30,0.07)', border: '1px solid var(--bc-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Settings size={17} color="#7a6040" strokeWidth={1.8}/>
          </motion.button>
        </div>

        {/* ── Profile hero ── */}
        <div style={{ background: isDark ? '#171208' : '#fffdf6', border: `1px solid ${isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)'}`, borderRadius: 22, padding: '22px 18px 18px', marginBottom: 14, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg,transparent,var(--bc-shimmer-top),transparent)' }}/>

          {/* Photo + Badge row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => fileRef.current?.click()}
                style={{ width: 82, height: 82, borderRadius: 22, overflow: 'hidden', cursor: 'pointer', background: 'linear-gradient(145deg,#f0ddb0,#dfc870)', border: '2.5px solid rgba(196,122,30,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(196,122,30,0.2)', position: 'relative' }}>
                {profileData?.photoURL
                  ? <img src={profileData.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--bc-text-amber)' }}>{profileData?.displayName?.[0]?.toUpperCase() || '📖'}</span>
                }
                {/* Hover overlay */}
                <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoUploading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff' }}/>
                    : <Camera size={18} color="#fff" strokeWidth={1.8}/>
                  }
                </motion.div>
              </motion.div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }}/>
              {/* Camera badge */}
              <div style={{ position: 'absolute', bottom: -3, right: -3, width: 24, height: 24, borderRadius: 8, background: '#c47a1e', border: `2px solid ${isDark ? '#0f0d09' : '#faf6ef'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(196,122,30,0.4)' }}>
                <Camera size={11} color="#fff" strokeWidth={2.2}/>
              </div>
            </div>

            {/* Name + username */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <InlineEdit
                value={profileData?.displayName}
                placeholder="Add your name"
                onSave={v => saveField('displayName', v)}
                maxLen={50}
              />
              <div style={{ fontSize: '0.76rem', color: 'var(--bc-amber)', fontWeight: 700, marginTop: 3 }}>
                @{profileData?.username || 'username'}
              </div>
              {profileData?.dob && (
                <div style={{ fontSize: '0.67rem', color: 'var(--bc-text-faint)', marginTop: 2 }}>
                  🎂 {new Date(profileData.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* Badge */}
            {profileData?.badge && (
              <motion.div whileTap={{ scale: 0.95 }} onClick={() => setShowBadgePicker(true)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                <ShinyBadge type={profileData.badge} size="md" showLabel={false}/>
              </motion.div>
            )}
          </div>

          {/* Bio */}
          <div style={{ padding: '12px 0', borderTop: '1px solid rgba(196,122,30,0.07)', borderBottom: '1px solid rgba(196,122,30,0.07)', marginBottom: 14 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--bc-text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Bio</div>
            <InlineEdit
              value={profileData?.bio}
              placeholder="Write a short bio — what kind of reader or writer are you?"
              onSave={v => saveField('bio', v)}
              multiline maxLen={160}
            />
          </div>

          {/* Badge pick / change */}
          <motion.button whileHover={{ scale: 1.01, x: 2 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowBadgePicker(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13, background: 'rgba(196,122,30,0.05)', border: '1px solid var(--bc-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
            {profileData?.badge
              ? <ShinyBadge type={profileData.badge} size="sm" showLabel={false}/>
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(196,122,30,0.1)', border: '1.5px dashed rgba(196,122,30,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Award size={16} color="#c47a1e" strokeWidth={1.8}/></div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--bc-text-primary)' }}>
                {profileData?.badge ? BADGES[profileData.badge]?.label : 'Set your badge'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--bc-text-muted)' }}>
                {profileData?.badge ? 'Tap to change' : 'Reader · Writer · Author'}
              </div>
            </div>
            <ChevronRight size={15} color="rgba(196,122,30,0.5)"/>
          </motion.button>
        </div>

        {/* ── Reading Preferences ── */}
        {(profileData?.genres?.length > 0 || profileData?.readingVibe) && (
          <div style={{ background: isDark ? '#171208' : '#fffdf6', border: `1px solid ${isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)'}`, borderRadius: 22, padding: '16px 18px', marginBottom: 14, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
            <SectionHead title="Reading Preferences"/>
            {profileData?.genres?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--bc-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Favourite Genres</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profileData.genres.map(g => (
                    <span key={g} style={{ fontSize: '0.75rem', padding: '4px 11px', borderRadius: 50, background: 'rgba(196,122,30,0.08)', border: '1px solid var(--bc-border)', color: 'var(--bc-text-amber)', fontWeight: 600 }}>
                      {g.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profileData?.readingVibe && (
              <div style={{ fontSize: '0.78rem', color: 'var(--bc-text-muted)', fontStyle: 'italic' }}>
                Reads for: <strong style={{ color: 'var(--bc-amber)' }}>{profileData.readingVibe.replace(/-/g, ' ')}</strong>
              </div>
            )}
          </div>
        )}

        {/* ── Privacy setting ── */}
        <div style={{ background: isDark ? '#171208' : '#fffdf6', border: `1px solid ${isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)'}`, borderRadius: 22, padding: '16px 18px', marginBottom: 14, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
          <SectionHead title="Privacy"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {privacyOpts.map(opt => {
              const Icon = opt.icon;
              const on = profileData?.privacyMode === opt.value || (!profileData?.privacyMode && opt.value === 'public');
              return (
                <motion.button key={opt.value}
                  whileHover={{ scale: 1.01, x: 2 }} whileTap={{ scale: 0.98 }}
                  onClick={() => saveField('privacyMode', opt.value)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13, background: on ? 'rgba(196,122,30,0.07)' : 'transparent', border: `1px solid ${on ? 'rgba(196,122,30,0.25)' : 'rgba(196,122,30,0.08)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: on ? 'rgba(196,122,30,0.12)' : 'rgba(196,122,30,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={on ? '#c47a1e' : '#9a8070'} strokeWidth={1.8}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: on ? 700 : 500, color: on ? 'var(--bc-text-primary)' : 'var(--bc-text-secondary)' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--bc-text-muted)' }}>{opt.desc}</div>
                  </div>
                  <AnimatePresence>
                    {on && <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      style={{ width: 20, height: 20, borderRadius: 6, background: '#c47a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#fff" strokeWidth={3}/>
                    </motion.div>}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Account actions ── */}
        <div style={{ background: isDark ? '#171208' : '#fffdf6', border: `1px solid ${isDark ? 'rgba(196,122,30,0.1)' : 'rgba(196,122,30,0.08)'}`, borderRadius: 22, padding: '16px 18px', marginBottom: 14, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
          <SectionHead title="Account"/>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.01, x: 2 }} whileTap={{ scale: 0.97 }}
            onClick={() => setLogoutConfirm(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px', borderRadius: 14, background: 'rgba(196,122,30,0.05)', border: '1px solid var(--bc-border-card)', cursor: 'pointer', marginBottom: 10, transition: 'all 0.2s' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(196,122,30,0.1)', border: '1px solid var(--bc-border-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={17} color="#c47a1e" strokeWidth={1.9}/>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--bc-text-primary)' }}>Sign Out</div>
              <div style={{ fontSize: '0.67rem', color: 'var(--bc-text-muted)' }}>Logout from this device</div>
            </div>
            <ChevronRight size={15} color="rgba(196,122,30,0.4)"/>
          </motion.button>

          {/* Delete account */}
          <motion.button
            whileHover={{ scale: 1.01, x: 2 }} whileTap={{ scale: 0.97 }}
            onClick={() => setDeleteConfirm(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px', borderRadius: 14, background: 'rgba(192,50,40,0.04)', border: '1px solid rgba(192,50,40,0.12)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(192,50,40,0.08)', border: '1px solid rgba(192,50,40,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={17} color="#c03228" strokeWidth={1.9}/>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '0.87rem', fontWeight: 700, color: '#c03228' }}>Delete Account</div>
              <div style={{ fontSize: '0.67rem', color: 'var(--bc-text-muted)' }}>Permanently delete all your data</div>
            </div>
            <ChevronRight size={15} color="rgba(192,50,40,0.3)"/>
          </motion.button>
        </div>

        {/* App version */}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--bc-text-faint)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            BookChat ✦ v1.0 Beta
          </p>
        </div>

      </main>

      <BottomNav active="profile"/>

      {/* ── Settings Panel ── */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: isDark ? 'rgba(0,0,0,0.82)' : 'rgba(10,7,3,0.62)', backdropFilter: 'blur(10px)' }}
            onClick={() => setSettingsOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxWidth: 500, margin: '0 auto', background: isDark ? '#171208' : '#fffdf6', borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', boxShadow: isDark ? '0 -8px 40px rgba(0,0,0,0.7)' : '0 -8px 40px rgba(0,0,0,0.1)' }}>

              {/* Handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--bc-border)', margin: '0 auto 20px' }}/>

              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--bc-text-primary)', letterSpacing: '-0.02em', marginBottom: 20, fontFamily: 'Gilroy, sans-serif' }}>
                ⚙️ Settings
              </h3>

              {/* Theme */}
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--bc-text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Gilroy, sans-serif' }}>
                  Appearance
                </p>
                <ThemeToggle compact={false} />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--bc-border)', margin: '4px 0 20px' }}/>

              {/* Close */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSettingsOpen(false)}
                style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'var(--bc-bg-chip)', border: '1px solid var(--bc-border)', color: 'var(--bc-text-muted)', fontFamily: 'Gilroy, sans-serif', fontSize: '0.87rem', fontWeight: 600, cursor: 'pointer' }}>
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showBadgePicker && (
          <BadgePicker
            current={profileData?.badge}
            onSelect={v => saveField('badge', v)}
            onClose={() => setShowBadgePicker(false)}
          />
        )}
        {logoutConfirm && (
          <ConfirmModal
            title="Sign out?"
            body="You'll be taken to the login screen. Your data stays safe."
            confirmLabel="Sign Out"
            danger={false}
            onConfirm={doLogout}
            onCancel={() => setLogoutConfirm(false)}
          />
        )}
        {deleteConfirm && (
          <ConfirmModal
            title="Delete your account?"
            body="This is permanent. All your posts, sparks, and data will be erased forever."
            confirmLabel="Delete Forever"
            danger={true}
            extraField={{ label: 'Confirm your password', type: 'password', placeholder: 'Enter your password' }}
            onConfirm={doDelete}
            onCancel={() => { setDeleteConfirm(false); setDeleteErr(''); }}
          />
        )}
      </AnimatePresence>

      {/* Delete error toast */}
      <AnimatePresence>
        {deleteErr && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 80, background: 'rgba(192,50,40,0.95)', color: '#fff', padding: '11px 20px', borderRadius: 50, fontSize: '0.8rem', fontFamily: 'Gilroy, sans-serif', fontWeight: 600, boxShadow: '0 8px 24px rgba(192,50,40,0.35)', whiteSpace: 'nowrap' }}>
            ⚠ {deleteErr}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        html, body { background: ${isDark ? '#0f0d09' : '#faf6ef'} !important; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}