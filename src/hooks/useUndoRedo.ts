import { useCallback, useState, useEffect } from 'react';
import { useHistoryCapability } from '@embedpdf/plugin-history/react';
import { useAnnotation } from '@embedpdf/plugin-annotation/react';

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
  const { provides: historyApi, isLoading } = useHistoryCapability();
  const { provides: annotationApi } = useAnnotation();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update history state by checking the API
  const updateHistoryState = useCallback(() => {
    if (!historyApi) {
      setCanUndo(false);
      setCanRedo(false);
      return;
    }

    // Check global undo/redo capability
    const newCanUndo = historyApi.canUndo?.() ?? false;
    const newCanRedo = historyApi.canRedo?.() ?? false;
    
    console.log('[useUndoRedo] Checking history state - canUndo:', newCanUndo, 'canRedo:', newCanRedo);
    
    // Only update and log if values actually changed
    setCanUndo(prev => {
      if (prev !== newCanUndo) {
        console.log('[useUndoRedo] ✓ canUndo changed:', prev, '->', newCanUndo);
        return newCanUndo;
      }
      return prev;
    });
    
    setCanRedo(prev => {
      if (prev !== newCanRedo) {
        console.log('[useUndoRedo] ✓ canRedo changed:', prev, '->', newCanRedo);
        return newCanRedo;
      }
      return prev;
    });
  }, [historyApi]);

  // Initialize once when plugin is ready (NO POLLING)
  useEffect(() => {
    if (isLoading) {
      console.log('[useUndoRedo] History plugin is loading...');
      return;
    }

    if (!historyApi) {
      console.warn('[useUndoRedo] HistoryCapability not available');
      return;
    }

    console.log('[useUndoRedo] HistoryCapability is ready');
    
    // Initial check only
    updateHistoryState();
  }, [historyApi, isLoading, updateHistoryState]);

  // Listen to annotation events to update undo/redo state
  useEffect(() => {
    if (!annotationApi) return;

    // Subscribe to annotation events (create, update, delete)
    const unsubscribe = annotationApi.onAnnotationEvent?.((event) => {
      console.log('[useUndoRedo] Annotation event detected:', event.type);
      // Update state when any annotation changes
      // We need a small delay to let the history plugin process the event
      setTimeout(() => updateHistoryState(), 150);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [annotationApi, updateHistoryState]);

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
    
    // Update state immediately after undo
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
    
    // Update state immediately after redo
    setTimeout(() => updateHistoryState(), 50);
  }, [historyApi, canRedo, updateHistoryState]);

  return {
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
  };
}

