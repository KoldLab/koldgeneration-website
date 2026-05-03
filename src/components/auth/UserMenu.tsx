import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, ChevronDown, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Switch } from '@/components/ui/switch';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const showFallbackIcon = !user.photoURL || imageError;

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {showFallbackIcon ? (
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <img
            src={user.photoURL || undefined}
            alt={user.displayName || t('common.user')}
            className="w-8 h-8 rounded-full shrink-0 object-cover"
            onError={() => setImageError(true)}
          />
        )}
        <span className="hidden sm:inline truncate">
          {user.displayName || t('common.user')}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background border rounded-md shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-sm border-b mb-1">
              <p className="font-medium">
                {user.displayName || t('common.user')}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>

            {/* Language Settings */}
            <div className="py-1 border-b">
              <LanguageSwitcher variant="accordion" expandInline={true} />
            </div>

            {/* Theme Settings */}
            <div className="px-3 py-2.5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Sun className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium">Theme</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={() => toggleTheme()}
                />
              </div>
            </div>

            {/* Sign Out */}
            <div className="pt-1">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start gap-2 px-3 py-2 h-auto"
              >
                <LogOut className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{t('common.signOut')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
