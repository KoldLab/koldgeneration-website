import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/useMobile';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  return isMobile ? (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8"
      aria-label={
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      }
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  ) : (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={() => toggleTheme()}
      />
      <Moon className="h-4 w-4" />
    </div>
  );
}
