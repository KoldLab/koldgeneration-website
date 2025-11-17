import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { isInAppBrowser } from '@/utils/browserDetection';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check for redirect result (when returning from OAuth redirect)
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            // User signed in via redirect
            setUser(result.user);
            setError(null);
          }
        })
        .catch((err) => {
          console.error('Redirect result error:', err);
          // Don't set error for redirect - user might have cancelled
        });

      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setUser(user);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Auth state error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Firebase auth initialization error:', err);
      setError(
        'Firebase not configured. Please check your environment variables.'
      );
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      // Use redirect for in-app browsers (WebView) that block popups
      // Use popup for regular browsers (better UX)
      if (isInAppBrowser()) {
        // Redirect will navigate away, so we don't await it
        await signInWithRedirect(auth, provider);
        // Note: User will be redirected to Google, then back to our app
        // The redirect result will be handled in useEffect via getRedirectResult
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      // Don't set error for popup_closed_by_user - it's user cancellation
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in');
      }
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
