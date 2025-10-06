// Error handling hook for managing errors in functional components

import { useState, useCallback } from 'react';
import { useToast } from './ToastProvider';

export interface UseErrorHandlerReturn {
  error: Error | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: Error | string, showToast?: boolean) => void;
  withErrorHandling: <T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R | undefined>;
}

export const useErrorHandler = (
  onError?: (error: Error) => void
): UseErrorHandlerReturn => {
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((
    err: Error | string,
    showToastNotification: boolean = true
  ) => {
    const errorObj = typeof err === 'string' ? new Error(err) : err;
    
    setError(errorObj);
    
    if (showToastNotification) {
      showToast(
        errorObj.message || 'An unexpected error occurred',
        'error'
      );
    }
    
    // Call custom error handler if provided
    onError?.(errorObj);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled by useErrorHandler:', errorObj);
    }
  }, [onError, showToast]);

  // Wrapper function for async operations with automatic error handling
  const withErrorHandling = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        const result = await asyncFn(...args);
        // Clear any previous errors on success
        clearError();
        return result;
      } catch (err) {
        handleError(err as Error);
        return undefined;
      }
    };
  }, [handleError, clearError]);

  return {
    error,
    isError: error !== null,
    clearError,
    handleError,
    withErrorHandling
  };
};

// Hook for global error reporting
export const useGlobalErrorHandler = () => {
  const { showToast } = useToast();

  const reportError = useCallback((
    error: Error,
    context?: string,
    additionalData?: Record<string, any>
  ) => {
    // Log to console
    console.error('Global error:', error, { context, additionalData });
    
    // Show user-friendly message
    showToast(
      'An unexpected error occurred. Please try again.',
      'error'
    );
    
    // Here you would typically send to error reporting service
    // Example: Sentry, LogRocket, etc.
    // sendToErrorReporting(error, context, additionalData);
  }, [showToast]);

  return { reportError };
};

// Error retry hook
export const useRetry = (maxRetries: number = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async <T extends unknown>(operation: () => Promise<T>): Promise<T> => {
    setIsRetrying(true);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          setIsRetrying(false);
          throw error;
        }
        setRetryCount(attempt + 1);
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setIsRetrying(false);
    throw new Error('Max retries exceeded');
  };

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
    reset
  };
};