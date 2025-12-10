import { useCallback, useState, useEffect, useRef } from 'react';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';

interface HistorySnapshot {
  annotations: Map<string, any>;
  timestamp: number;
}

interface UseUndoRedoProps {
  annotationState: any;
  annotationProvider: any;
  enabled?: boolean;
}

const MAX_HISTORY = 50;

export function useUndoRedo({ annotationState, annotationProvider, enabled = true }: UseUndoRedoProps) {
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
  const lastStateHashRef = useRef<string>('');
  const isRestoringRef = useRef(false);

  // Criar snapshot das anotações
  const captureSnapshot = useCallback((): HistorySnapshot | null => {
    if (!annotationState?.byUid) return null;

    const annotationMap = new Map();
    
    // Copiar todas as anotações de forma profunda
    Object.entries(annotationState.byUid).forEach(([id, annotation]: [string, any]) => {
      if (annotation) {
        annotationMap.set(id, {
          ...annotation,
          object: { ...annotation.object },
        });
      }
    });

    return {
      annotations: annotationMap,
      timestamp: Date.now(),
    };
  }, [annotationState?.byUid]);

  // Gerar hash do estado para detectar mudanças
  const getStateHash = useCallback((snapshot: HistorySnapshot | null): string => {
    if (!snapshot) return '';
    const ids = Array.from(snapshot.annotations.keys()).sort().join(',');
    return `${ids}_${snapshot.timestamp}`;
  }, []);

  // Detectar mudanças e adicionar ao histórico
  useEffect(() => {
    if (!enabled || !annotationProvider || isRestoringRef.current) return;

    const currentSnapshot = captureSnapshot();
    if (!currentSnapshot) return;

    const currentHash = getStateHash(currentSnapshot);

    // Se é a primeira captura ou não houve mudanças, apenas atualizar referência
    if (!lastStateHashRef.current || currentHash === lastStateHashRef.current) {
      if (currentHash !== lastStateHashRef.current) {
        lastStateHashRef.current = currentHash;
        console.debug('[Undo/Redo] First capture or same state, annotations:', currentSnapshot.annotations.size);
      }
      return;
    }

    // Houve mudanças - adicionar snapshot anterior ao undo stack
    const previousSnapshot = captureSnapshot();
    if (previousSnapshot && previousSnapshot.annotations.size >= 0) {
      console.debug('[Undo/Redo] State changed! Pushing to undo stack. Size:', previousSnapshot.annotations.size);
      setUndoStack((prev) => {
        const newStack = [...prev, previousSnapshot];
        console.debug('[Undo/Redo] Undo stack size now:', newStack.length);
        return newStack.length > MAX_HISTORY
          ? newStack.slice(newStack.length - MAX_HISTORY)
          : newStack;
      });

      // Limpar redo stack quando nova ação é realizada
      setRedoStack([]);
    }

    lastStateHashRef.current = currentHash;
  }, [annotationState?.byUid, annotationProvider, enabled, captureSnapshot, getStateHash]);

  // Restaurar snapshot
  const restoreSnapshot = useCallback(
    (snapshot: HistorySnapshot) => {
      if (!annotationProvider || !annotationState) {
        console.warn('[Undo/Redo] Cannot restore: missing provider or state');
        return;
      }

      isRestoringRef.current = true;
      console.debug('[Undo/Redo] Starting restore...');

      try {
        const currentIds = Object.keys(annotationState.byUid || {});
        const targetIds = Array.from(snapshot.annotations.keys());

        console.debug('[Undo/Redo] Current IDs:', currentIds.length, 'Target IDs:', targetIds.length);

        // Remover anotações que não existem no snapshot
        currentIds.forEach((id) => {
          if (!targetIds.includes(id)) {
            try {
              console.debug('[Undo/Redo] Deleting annotation:', id);
              annotationProvider.deleteAnnotation?.(id);
            } catch (error) {
              console.warn(`Erro ao deletar anotação ${id}:`, error);
            }
          }
        });

        // Restaurar/recriar anotações
        let recreated = 0;
        snapshot.annotations.forEach((annotationData, id) => {
          try {
            if (currentIds.includes(id)) {
              // Anotação existe, tentar deletar e recriar
              console.debug('[Undo/Redo] Deleting existing annotation for recreation:', id);
              annotationProvider.deleteAnnotation?.(id);
            }

            // Recriar a anotação
            if (annotationData.object && annotationData.pageIndex !== undefined) {
              const { object, pageIndex } = annotationData;
              
              console.debug('[Undo/Redo] Recreating annotation on page', pageIndex, 'type:', object.subtype || object.type);
              
              // Usar createAnnotation com dados do snapshot
              annotationProvider.createAnnotation?.(pageIndex, {
                ...object,
                subtype: object.subtype || object.type,
                rect: object.rect,
                color: object.color,
                contents: object.contents,
                author: object.author || 'User',
                subject: object.subject || '',
              } as any);
              
              recreated++;
            }
          } catch (error) {
            console.warn(`Erro ao restaurar anotação ${id}:`, error);
          }
        });

        console.debug('[Undo/Redo] Restore complete. Recreated:', recreated);

        // Atualizar hash
        lastStateHashRef.current = getStateHash(snapshot);
      } finally {
        isRestoringRef.current = false;
      }
    },
    [annotationProvider, annotationState, getStateHash]
  );

  // Undo
  const undo = useCallback(() => {
    console.debug('[Undo/Redo] Undo called. Stack size:', undoStack.length);
    if (undoStack.length === 0) {
      console.warn('[Undo/Redo] Undo stack is empty!');
      return;
    }

    const currentSnapshot = captureSnapshot();
    if (!currentSnapshot) {
      console.warn('[Undo/Redo] Could not capture current snapshot!');
      return;
    }

    const previousSnapshot = undoStack[undoStack.length - 1];
    console.debug('[Undo/Redo] Restoring to snapshot with', previousSnapshot.annotations.size, 'annotations');

    // Guardar estado atual para redo
    setRedoStack((prev) => [...prev, currentSnapshot]);
    setUndoStack((prev) => prev.slice(0, -1));

    // Restaurar estado anterior
    setTimeout(() => {
      restoreSnapshot(previousSnapshot);
    }, 50);
  }, [undoStack, captureSnapshot, restoreSnapshot]);

  // Redo
  const redo = useCallback(() => {
    console.debug('[Undo/Redo] Redo called. Stack size:', redoStack.length);
    if (redoStack.length === 0) {
      console.warn('[Undo/Redo] Redo stack is empty!');
      return;
    }

    const currentSnapshot = captureSnapshot();
    if (!currentSnapshot) {
      console.warn('[Undo/Redo] Could not capture current snapshot!');
      return;
    }

    const nextSnapshot = redoStack[redoStack.length - 1];
    console.debug('[Undo/Redo] Restoring to snapshot with', nextSnapshot.annotations.size, 'annotations');

    // Guardar estado atual para undo
    setUndoStack((prev) => [...prev, currentSnapshot]);
    setRedoStack((prev) => prev.slice(0, -1));

    // Restaurar estado próximo
    setTimeout(() => {
      restoreSnapshot(nextSnapshot);
    }, 50);
  }, [redoStack, captureSnapshot, restoreSnapshot]);

  return {
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
  };
}
