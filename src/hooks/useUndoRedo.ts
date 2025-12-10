import { useCallback, useState, useEffect } from 'react';
import { useHistoryCapability } from '@embedpdf/plugin-history/react';

interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
}

/**
 * Custom hook that leverages EmbedPDF's built-in HistoryPlugin
 * for automatic undo/redo functionality.
 * 
 * The HistoryPlugin tracks all annotation operations (create, update, delete)
 * and provides undo/redo capabilities automatically.
 */
export function useUndoRedo(): UseUndoRedoReturn {
  const { provides: historyApi } = useHistoryCapability();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update history state - called both on mount and when performing undo/redo
  const updateHistoryState = useCallback(() => {
    if (!historyApi) return;

    // Check global undo/redo capability
    const newCanUndo = historyApi.canUndo?.() ?? false;
    const newCanRedo = historyApi.canRedo?.() ?? false;
    
    setCanUndo(newCanUndo);
    setCanRedo(newCanRedo);
  }, [historyApi]);

  // Initialize state on mount
  useEffect(() => {
    if (!historyApi) {
      console.warn('[useUndoRedo] HistoryCapability not available');
      return;
    }

    // Check initial state
    updateHistoryState();
  }, [historyApi, updateHistoryState]);

  const handleUndo = useCallback(() => {
    if (!historyApi) {
      console.warn('[useUndoRedo] Cannot undo: HistoryCapability not available');
      return;
    }

    if (!canUndo) {
      console.debug('[useUndoRedo] Nothing to undo');
      return;
    }

    console.debug('[useUndoRedo] Performing undo');
    historyApi.undo?.();
    
    // Update state after a brief delay to let the plugin process
    setTimeout(() => updateHistoryState(), 50);
  }, [historyApi, canUndo, updateHistoryState]);

  const handleRedo = useCallback(() => {
    if (!historyApi) {
      console.warn('[useUndoRedo] Cannot redo: HistoryCapability not available');
      return;
    }

    if (!canRedo) {
      console.debug('[useUndoRedo] Nothing to redo');
      return;
    }

    console.debug('[useUndoRedo] Performing redo');
    historyApi.redo?.();
    
    // Update state after a brief delay to let the plugin process
    setTimeout(() => updateHistoryState(), 50);
  }, [historyApi, canRedo, updateHistoryState]);

  return {
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
  };
}

