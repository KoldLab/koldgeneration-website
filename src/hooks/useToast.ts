import { useTranslation } from 'react-i18next';
import { toast as sonnerToast, type ToastOptions } from 'sonner';

/**
 * Custom hook for consistent toast notifications
 * Provides typed methods with i18n integration and consistent styling
 */
export function useToast() {
  const { t } = useTranslation();

  /**
   * Show a success toast
   */
  const success = (
    message: string,
    options?: Omit<ToastOptions, 'description'>
  ) => {
    return sonnerToast.success(message, {
      duration: 4000,
      ...options,
    });
  };

  /**
   * Show an error toast
   */
  const error = (
    message: string,
    options?: Omit<ToastOptions, 'description'>
  ) => {
    return sonnerToast.error(message, {
      duration: 5000, // Errors stay longer
      ...options,
    });
  };

  /**
   * Show an info toast
   */
  const info = (
    message: string,
    options?: Omit<ToastOptions, 'description'>
  ) => {
    return sonnerToast.info(message, {
      duration: 4000,
      ...options,
    });
  };

  /**
   * Show a warning toast
   */
  const warning = (
    message: string,
    options?: Omit<ToastOptions, 'description'>
  ) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      ...options,
    });
  };

  /**
   * Show a success toast with undo action
   */
  const successWithUndo = (
    message: string,
    undoAction: () => void,
    undoLabel?: string,
    options?: Omit<ToastOptions, 'description' | 'action'>
  ) => {
    return sonnerToast.success(message, {
      duration: 5000, // Longer duration for undo
      action: {
        label: undoLabel || t('common.undo'),
        onClick: undoAction,
      },
      ...options,
    });
  };

  /**
   * Show a loading toast (returns a function to update/dismiss)
   */
  const loading = (
    message: string,
    options?: Omit<ToastOptions, 'description'>
  ) => {
    return sonnerToast.loading(message, {
      duration: Infinity, // Loading toasts don't auto-dismiss
      ...options,
    });
  };

  /**
   * Show a promise toast (handles loading, success, error states)
   */
  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: Omit<ToastOptions, 'description'>
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...options,
    });
  };

  return {
    success,
    error,
    info,
    warning,
    successWithUndo,
    loading,
    promise,
    // Direct access to sonner toast for advanced use cases
    toast: sonnerToast,
  };
}

