import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthListener } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Quiz from './pages/onboarding/Quiz';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bc-bg-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--bc-amber-glow)',
      fontSize: '1.5rem'
    }}>
      📚
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingComplete) return <Navigate to="/quiz" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bc-bg-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--bc-amber-glow)',
      fontSize: '1.5rem'
    }}>
      📚
    </div>
  );
  if (user) {
    if (!user.onboardingComplete) return <Navigate to="/quiz" replace />;
    return <Navigate to="/home" replace />;
  }
  return children;
}

export default function App() {
  useAuthListener();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/quiz"     element={<Quiz />} />
        <Route path="/home"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/explore"  element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chat"     element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}