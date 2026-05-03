import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useMobile';

interface LanguageSwitcherProps {
  variant?: 'inline' | 'accordion';
  className?: string;
  expandInline?: boolean; // For accordion variant: true = expand inline (menu), false = dropdown (navbar)
}

export function LanguageSwitcher({
  variant = 'inline',
  className = '',
  expandInline = false,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  if (variant === 'accordion') {
    if (expandInline) {
      // Inline expansion for menu contexts (UserMenu)
      return (
        <div className={className} ref={dropdownRef}>
          <Button
            variant="ghost"
            className="w-full justify-between px-3 py-2 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Language</span>
            </div>
          </Button>
          {isOpen && (
            <div className="mt-1 space-y-1">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant="ghost"
                  className={`w-full justify-start pl-9 pr-3 py-1.5 h-auto text-sm ${
                    i18n.language === lang.code ? 'bg-accent font-medium' : 'text-muted-foreground'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLanguageChange(lang.code);
                  }}
                >
                  {lang.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Dropdown button for navbar contexts
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <Button
          size={isMobile ? 'icon' : 'sm'}
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={isMobile ? 'h-8 w-8' : 'flex items-center gap-2'}
        >
          <Languages className="h-4 w-4" />
          {!isMobile && <span className="text-sm font-medium">Language</span>}
          <span className="sr-only">Language</span>
        </Button>
        {isOpen && (
          <div className="absolute right-0 mt-1 min-w-full rounded-md border bg-background shadow-lg z-50">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="ghost"
                size="sm"
                className={`w-full justify-start px-3 py-1.5 text-xs first:rounded-t-md last:rounded-b-md ${
                  i18n.language === lang.code ? 'bg-accent font-medium' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLanguageChange(lang.code);
                }}
              >
                {lang.name}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Inline variant (original dropdown button)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        size={isMobile ? 'icon' : 'sm'}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={isMobile ? 'h-8 w-8' : 'flex items-center gap-2'}
      >
        <Languages className="h-4 w-4" />
        {!isMobile && <span>{currentLanguage.name}</span>}
        <span className="sr-only">Select language</span>
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-1 min-w-full bg-background border rounded-md shadow-lg z-50">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="ghost"
              size="sm"
              className={`w-full justify-start px-3 py-1.5 text-xs first:rounded-t-md last:rounded-b-md ${
                i18n.language === lang.code ? 'bg-accent font-medium' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleLanguageChange(lang.code);
              }}
            >
              {lang.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
