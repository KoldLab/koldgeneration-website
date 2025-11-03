import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginButton() {
  const { signInWithGoogle, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <Button onClick={handleLogin} disabled={loading} variant="default">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4 mr-2" />
          Sign in
        </>
      )}
    </Button>
  );
}
