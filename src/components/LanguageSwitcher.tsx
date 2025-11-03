import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'inline' | 'accordion';
  className?: string;
  expandInline?: boolean; // For accordion variant: true = expand inline (menu), false = dropdown (navbar)
}

export function LanguageSwitcher({ variant = 'inline', className = '', expandInline = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
          <button
            className="w-full flex items-center justify-between"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Language</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <div className="mt-2 space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`w-full text-left px-6 py-1.5 text-xs rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${
                    i18n.language === lang.code ? 'bg-accent font-medium' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLanguageChange(lang.code);
                  }}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Dropdown button for navbar contexts
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <Languages className="h-4 w-4" />
          <span className="text-sm font-medium">Language</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-1 w-32 bg-background border rounded-md shadow-lg z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-md last:rounded-b-md ${
                  i18n.language === lang.code ? 'bg-accent font-medium' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLanguageChange(lang.code);
                }}
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Inline variant (original dropdown button)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Languages className="h-4 w-4" />
        <span>{currentLanguage.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-background border rounded-md shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-md last:rounded-b-md ${
                i18n.language === lang.code ? 'bg-accent font-medium' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleLanguageChange(lang.code);
              }}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
