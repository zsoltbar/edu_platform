// Keyboard shortcuts hook for admin interfaces

import { useEffect, useCallback, useRef } from 'react';

// Key combination interface
export interface KeyCombination {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface KeyboardShortcut extends KeyCombination {
  callback: () => void;
  description?: string;
  disabled?: boolean;
  global?: boolean; // If true, works even when input elements are focused
}

export interface UseKeyboardOptions {
  enabled?: boolean;
  target?: HTMLElement | Document;
}

export const useKeyboard = (
  shortcuts: KeyboardShortcut[] = [],
  options: UseKeyboardOptions = {}
) => {
  const { enabled = true, target } = options;
  const shortcutsRef = useRef(shortcuts);
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.hasAttribute('contenteditable')
    );

    // Check each shortcut
    for (const shortcut of shortcutsRef.current) {
      if (shortcut.disabled) continue;
      
      // Skip non-global shortcuts when input is focused
      if (!shortcut.global && isInputFocused) continue;

      // Check if key combination matches
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = (shortcut.ctrlKey ?? false) === event.ctrlKey;
      const metaMatches = (shortcut.metaKey ?? false) === event.metaKey;
      const shiftMatches = (shortcut.shiftKey ?? false) === event.shiftKey;
      const altMatches = (shortcut.altKey ?? false) === event.altKey;

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }
        
        shortcut.callback();
        break; // Only execute first matching shortcut
      }
    }
  }, [enabled]);

  useEffect(() => {
    const targetElement = target || document;
    
    if (enabled) {
      targetElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled, target]);

  return {
    shortcuts: shortcutsRef.current
  };
};

// Hook for individual shortcut
export const useKeyboardShortcut = (
  shortcut: KeyCombination,
  callback: () => void,
  options: UseKeyboardOptions & { description?: string; disabled?: boolean; global?: boolean } = {}
) => {
  const { description, disabled = false, global = false, ...keyboardOptions } = options;

  const shortcuts = [
    {
      ...shortcut,
      callback,
      description,
      disabled,
      global
    }
  ];

  return useKeyboard(shortcuts, keyboardOptions);
};

// Common shortcut combinations
export const COMMON_SHORTCUTS = {
  SAVE: { key: 's', ctrlKey: true, metaKey: true },
  COPY: { key: 'c', ctrlKey: true, metaKey: true },
  PASTE: { key: 'v', ctrlKey: true, metaKey: true },
  UNDO: { key: 'z', ctrlKey: true, metaKey: true },
  REDO: { key: 'y', ctrlKey: true, metaKey: true },
  SELECT_ALL: { key: 'a', ctrlKey: true, metaKey: true },
  FIND: { key: 'f', ctrlKey: true, metaKey: true },
  NEW: { key: 'n', ctrlKey: true, metaKey: true },
  DELETE: { key: 'Delete' },
  ESCAPE: { key: 'Escape' },
  ENTER: { key: 'Enter' },
  SPACE: { key: ' ' },
  ARROW_UP: { key: 'ArrowUp' },
  ARROW_DOWN: { key: 'ArrowDown' },
  ARROW_LEFT: { key: 'ArrowLeft' },
  ARROW_RIGHT: { key: 'ArrowRight' },
  TAB: { key: 'Tab' },
  SHIFT_TAB: { key: 'Tab', shiftKey: true }
} as const;

// Admin-specific shortcuts
export const ADMIN_SHORTCUTS = {
  QUICK_SEARCH: { key: 'k', ctrlKey: true, metaKey: true, global: true },
  TOGGLE_SIDEBAR: { key: 'b', ctrlKey: true, metaKey: true, global: true },
  GO_TO_DASHBOARD: { key: 'd', ctrlKey: true, metaKey: true, global: true },
  GO_TO_USERS: { key: 'u', ctrlKey: true, metaKey: true, global: true },
  GO_TO_TASKS: { key: 't', ctrlKey: true, metaKey: true, global: true },
  REFRESH_DATA: { key: 'r', ctrlKey: true, metaKey: true, global: true },
  TOGGLE_HELP: { key: '?', shiftKey: true, global: true }
} as const;

// Hook for navigation shortcuts
export const useNavigationShortcuts = (
  navigation: {
    goToDashboard?: () => void;
    goToUsers?: () => void;
    goToTasks?: () => void;
    refreshData?: () => void;
    toggleSidebar?: () => void;
    openQuickSearch?: () => void;
    toggleHelp?: () => void;
  },
  options: UseKeyboardOptions = {}
) => {
  const shortcuts: KeyboardShortcut[] = [
    navigation.goToDashboard && {
      ...ADMIN_SHORTCUTS.GO_TO_DASHBOARD,
      callback: navigation.goToDashboard,
      description: 'Go to Dashboard'
    },
    navigation.goToUsers && {
      ...ADMIN_SHORTCUTS.GO_TO_USERS,
      callback: navigation.goToUsers,
      description: 'Go to Users'
    },
    navigation.goToTasks && {
      ...ADMIN_SHORTCUTS.GO_TO_TASKS,
      callback: navigation.goToTasks,
      description: 'Go to Tasks'
    },
    navigation.refreshData && {
      ...ADMIN_SHORTCUTS.REFRESH_DATA,
      callback: navigation.refreshData,
      description: 'Refresh Data'
    },
    navigation.toggleSidebar && {
      ...ADMIN_SHORTCUTS.TOGGLE_SIDEBAR,
      callback: navigation.toggleSidebar,
      description: 'Toggle Sidebar'
    },
    navigation.openQuickSearch && {
      ...ADMIN_SHORTCUTS.QUICK_SEARCH,
      callback: navigation.openQuickSearch,
      description: 'Quick Search'
    },
    navigation.toggleHelp && {
      ...ADMIN_SHORTCUTS.TOGGLE_HELP,
      callback: navigation.toggleHelp,
      description: 'Toggle Help'
    }
  ].filter(Boolean) as KeyboardShortcut[];

  return useKeyboard(shortcuts, options);
};

// Hook for form shortcuts
export const useFormShortcuts = (
  formActions: {
    save?: () => void;
    cancel?: () => void;
    reset?: () => void;
    submit?: () => void;
  },
  options: UseKeyboardOptions = {}
) => {
  const shortcuts: KeyboardShortcut[] = [
    formActions.save && {
      ...COMMON_SHORTCUTS.SAVE,
      callback: formActions.save,
      description: 'Save Form',
      global: true
    },
    formActions.cancel && {
      ...COMMON_SHORTCUTS.ESCAPE,
      callback: formActions.cancel,
      description: 'Cancel'
    },
    formActions.submit && {
      key: 'Enter',
      ctrlKey: true,
      callback: formActions.submit,
      description: 'Submit Form'
    }
  ].filter(Boolean) as KeyboardShortcut[];

  return useKeyboard(shortcuts, options);
};

// Hook for table shortcuts
export const useTableShortcuts = (
  tableActions: {
    selectAll?: () => void;
    deleteSelected?: () => void;
    editSelected?: () => void;
    navigateUp?: () => void;
    navigateDown?: () => void;
    refresh?: () => void;
  },
  options: UseKeyboardOptions = {}
) => {
  const shortcuts: KeyboardShortcut[] = [
    tableActions.selectAll && {
      ...COMMON_SHORTCUTS.SELECT_ALL,
      callback: tableActions.selectAll,
      description: 'Select All'
    },
    tableActions.deleteSelected && {
      ...COMMON_SHORTCUTS.DELETE,
      callback: tableActions.deleteSelected,
      description: 'Delete Selected'
    },
    tableActions.editSelected && {
      key: 'Enter',
      callback: tableActions.editSelected,
      description: 'Edit Selected'
    },
    tableActions.navigateUp && {
      ...COMMON_SHORTCUTS.ARROW_UP,
      callback: tableActions.navigateUp,
      description: 'Navigate Up'
    },
    tableActions.navigateDown && {
      ...COMMON_SHORTCUTS.ARROW_DOWN,
      callback: tableActions.navigateDown,
      description: 'Navigate Down'
    },
    tableActions.refresh && {
      key: 'F5',
      callback: tableActions.refresh,
      description: 'Refresh Table'
    }
  ].filter(Boolean) as KeyboardShortcut[];

  return useKeyboard(shortcuts, options);
};