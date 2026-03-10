import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

export function useAuthListener() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let unsubFirestore = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Cancel any previous Firestore listener
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (firebaseUser) {
        // Live listener — store updates instantly when Firestore doc changes
        // This is what makes the quiz redirect work: when quiz saves
        // onboardingComplete: true, this fires and updates the store,
        // so ProtectedRoute sees the new value and lets the user through.
        unsubFirestore = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              setUser({ uid: firebaseUser.uid, ...snap.data() });
            } else {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
            }
            setLoading(false);
          },
          (err) => {
            console.error('Firestore listener error:', err);
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);
}