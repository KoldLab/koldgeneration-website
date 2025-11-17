import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-center"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          '--error-bg': 'var(--destructive)',
          '--error-text': 'var(--destructive-foreground, var(--popover-foreground))',
          '--error-border': 'var(--destructive)',
          '--warning-bg': 'oklch(0.9 0.15 85)',
          '--warning-text': 'oklch(0.2 0 0)',
          '--warning-border': 'oklch(0.85 0.2 85)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
