import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { useAppUpdate } from '@/hooks/useAppUpdate';

/**
 * Watches for a newly deployed build and, when one is detected, shows a
 * persistent toast inviting the user to refresh onto the latest version.
 * Renders nothing itself.
 */
export function AppUpdatePrompt() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { updateAvailable, hardRefresh } = useAppUpdate();

  useEffect(() => {
    if (!updateAvailable) return;
    toast.info(t('common.update.available'), {
      id: 'app-update',
      duration: Infinity,
      closeButton: true,
      action: {
        label: t('common.update.action'),
        onClick: () => void hardRefresh(),
      },
    });
  }, [updateAvailable, hardRefresh, toast, t]);

  return null;
}
