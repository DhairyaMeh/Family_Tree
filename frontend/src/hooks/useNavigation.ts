/**
 * Custom hook for managing navigation state within the family tree.
 * Implements a history stack for back/forward navigation between focused persons.
 */

import { useState, useCallback, useMemo } from 'react';
import type { NavigationEntry } from '../types';

export interface UseNavigationReturn {
  // Current focus
  focusedPersonId: string | null;
  
  // Navigation
  navigateTo: (personId: string) => void;
  goBack: () => void;
  goForward: () => void;
  
  // State
  canGoBack: boolean;
  canGoForward: boolean;
  history: NavigationEntry[];
  historyIndex: number;
  
  // Reset
  resetNavigation: (initialPersonId?: string) => void;
}

export function useNavigation(initialPersonId?: string): UseNavigationReturn {
  const [history, setHistory] = useState<NavigationEntry[]>(() => 
    initialPersonId 
      ? [{ personId: initialPersonId, timestamp: Date.now() }]
      : []
  );
  const [historyIndex, setHistoryIndex] = useState(initialPersonId ? 0 : -1);

  /**
   * Navigate to a specific person.
   * Clears forward history and adds new entry.
   */
  const navigateTo = useCallback((personId: string) => {
    setHistory(prev => {
      // If we're not at the end of history, truncate forward history
      const newHistory = prev.slice(0, historyIndex + 1);
      
      // Don't add if we're already at this person
      if (newHistory.length > 0 && newHistory[newHistory.length - 1].personId === personId) {
        return newHistory;
      }
      
      return [
        ...newHistory,
        { personId, timestamp: Date.now() }
      ];
    });
    
    setHistoryIndex(prev => {
      // If current is same person, don't increment
      if (history[prev]?.personId === personId) {
        return prev;
      }
      return prev + 1;
    });
  }, [historyIndex, history]);

  /**
   * Go back in navigation history.
   */
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex]);

  /**
   * Go forward in navigation history.
   */
  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length]);

  /**
   * Reset navigation state.
   */
  const resetNavigation = useCallback((initialPersonId?: string) => {
    if (initialPersonId) {
      setHistory([{ personId: initialPersonId, timestamp: Date.now() }]);
      setHistoryIndex(0);
    } else {
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, []);

  // Derived state
  const focusedPersonId = useMemo(() => {
    return history[historyIndex]?.personId || null;
  }, [history, historyIndex]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  return {
    focusedPersonId,
    navigateTo,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    history,
    historyIndex,
    resetNavigation,
  };
}

