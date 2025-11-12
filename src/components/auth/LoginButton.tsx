import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function LoginButton() {
  const { signInWithGoogle, loading, user } = useAuth();
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      // Auth state will update automatically via onAuthStateChanged
      // No need to manually refresh - React will re-render when user state changes
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Reset signing in state when user changes
  useEffect(() => {
    if (user) {
      setIsSigningIn(false);
    }
  }, [user]);

  return (
    <Button
      onClick={handleLogin}
      disabled={loading || isSigningIn}
      variant="default"
      size="sm"
      className="gap-2"
    >
      {loading || isSigningIn ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t('common.signingIn')}
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4 mr-2" />
          {t('common.signIn')}
        </>
      )}
    </Button>
  );
}
