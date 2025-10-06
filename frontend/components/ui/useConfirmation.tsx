// Confirmation hook for easy confirmation dialogs

import { useState, useCallback } from 'react';

interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
}

interface UseConfirmationReturn {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  loading: boolean;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmation = (): UseConfirmationReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolver, setResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((confirmOptions: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(confirmOptions);
      setIsOpen(true);
      setResolver({ resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setLoading(true);
    
    // Allow for async operations
    setTimeout(() => {
      if (resolver) {
        resolver.resolve(true);
      }
      setIsOpen(false);
      setLoading(false);
      setResolver(null);
      setOptions(null);
    }, 100); // Small delay for UX
  }, [resolver]);

  const handleCancel = useCallback(() => {
    if (resolver) {
      resolver.resolve(false);
    }
    setIsOpen(false);
    setLoading(false);
    setResolver(null);
    setOptions(null);
  }, [resolver]);

  return {
    isOpen,
    options,
    loading,
    confirm,
    handleConfirm,
    handleCancel
  };
};

// Provider component for confirmation dialogs
import React, { createContext, useContext, ReactNode } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmationDialog must be used within a ConfirmationProvider');
  }
  return context;
};

interface ConfirmationProviderProps {
  children: ReactNode;
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({ children }) => {
  const confirmation = useConfirmation();

  const contextValue: ConfirmationContextType = {
    confirm: confirmation.confirm
  };

  return (
    <ConfirmationContext.Provider value={contextValue}>
      {children}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        title={confirmation.options?.title}
        message={confirmation.options?.message || ''}
        confirmText={confirmation.options?.confirmText}
        cancelText={confirmation.options?.cancelText}
        confirmVariant={confirmation.options?.variant}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        loading={confirmation.loading}
      />
    </ConfirmationContext.Provider>
  );
};