import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Path ekdum tere folder structure ke hisaab se set kar diya hai:
import { auth, db } from '../../lib/firebase'; 
import { Eye, EyeOff, Loader2, Mail, Lock, BookOpen } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists() && !userDoc.data().onboardingComplete) {
        navigate('/quiz');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError('Invalid email or password. Let’s try that again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || '',
          username: result.user.email.split('@')[0],
          photoURL: result.user.photoURL || '',
          role: 'reader',
          onboardingComplete: false,
          createdAt: Date.now(),
        });
        navigate('/quiz');
      } else {
        navigate(userDoc.data().onboardingComplete ? '/home' : '/quiz');
      }
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f12] text-white p-4 overflow-hidden relative">
      {/* Soft Animated Background Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#c47a1e] rounded-full blur-[120px] opacity-20 pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#8b5a2b] rounded-full blur-[100px] opacity-10 pointer-events-none"
      />

      {/* Main Login Card with Glass/Clay feel */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-[#16100a]/80 backdrop-blur-xl border border-[#c47a1e]/20 p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
      >
        {/* Logo Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-[#1e160e] rounded-2xl shadow-[inset_0_-4px_6px_rgba(0,0,0,0.4)] border border-[#c47a1e]/30">
            <BookOpen className="w-8 h-8 text-[#c47a1e]" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[#f0e6d3]">Welcome Back</h1>
          <p className="text-[#8a7b6a] text-sm">Dive back into your reading universe.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="space-y-5">
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8a7b6a]" />
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f0c08] border border-[#3c2c1c] rounded-xl py-3 pl-12 pr-4 text-sm text-[#f0e6d3] focus:outline-none focus:ring-2 focus:ring-[#c47a1e]/50 focus:border-transparent transition-all shadow-inner placeholder-[#5a4e42]"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8a7b6a]" />
            <input 
              type={showPass ? "text" : "password"} 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f0c08] border border-[#3c2c1c] rounded-xl py-3 pl-12 pr-12 text-sm text-[#f0e6d3] focus:outline-none focus:ring-2 focus:ring-[#c47a1e]/50 focus:border-transparent transition-all shadow-inner placeholder-[#5a4e42]"
            />
            <button 
              type="button" 
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8a7b6a] hover:text-[#c47a1e] transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="text-[#c0624a] text-xs font-medium text-center bg-[#c0624a]/10 py-2 rounded-lg border border-[#c0624a]/20"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#8b5a2b] to-[#b8711a] hover:from-[#a06832] hover:to-[#c47a1e] rounded-xl text-sm font-semibold text-[#fdf0e0] shadow-[0_4px_20px_rgba(196,122,30,0.25)] transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </motion.button>
        </form>

        <div className="my-6 flex items-center justify-center gap-4">
          <div className="h-px bg-[#c47a1e]/20 flex-1"></div>
          <span className="text-xs text-[#5a4e42] uppercase tracking-wider font-semibold">Or</span>
          <div className="h-px bg-[#c47a1e]/20 flex-1"></div>
        </div>

        {/* Google Button */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin} 
          disabled={gLoading}
          className="w-full py-3 bg-[#1e160e] hover:bg-[#2a1e13] border border-[#c47a1e]/20 rounded-xl text-sm font-medium text-[#c8bfb4] transition-all flex justify-center items-center gap-3 shadow-sm"
        >
          {gLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#8a7b6a]" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </motion.button>

        <p className="mt-8 text-center text-sm text-[#8a7b6a]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#c47a1e] font-semibold hover:text-[#e8a94a] transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}