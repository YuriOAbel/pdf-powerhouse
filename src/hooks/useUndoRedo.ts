import { useCallback, useState, useEffect, useRef } from 'react';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';

interface HistoryState {
  annotations: Record<string, TrackedAnnotation | undefined>;
  timestamp: number;
}

interface UseUndoRedoProps {
  annotationState: any;
  annotationProvider: any;
  enabled?: boolean;
}

const MAX_HISTORY = 50; // Limite de histórico para não consumir muita memória

export function useUndoRedo({ annotationState, annotationProvider, enabled = true }: UseUndoRedoProps) {
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
  const lastStateRef = useRef<HistoryState | null>(null);
  const isRestoringRef = useRef(false);

  // Capturar estado atual das anotações
  const captureState = useCallback((): HistoryState | null => {
    if (!annotationState?.byUid) return null;

    return {
      annotations: { ...annotationState.byUid },
      timestamp: Date.now(),
    };
  }, [annotationState?.byUid]);

  // Detectar mudanças no estado de anotações e adicionar ao histórico
  useEffect(() => {
    if (!enabled || !annotationProvider || isRestoringRef.current) return;

    const currentState = captureState();
    if (!currentState) return;

    // Comparar com o último estado capturado
    const lastState = lastStateRef.current;

    if (lastState === null) {
      // Primeira captura
      lastStateRef.current = currentState;
      return;
    }

    // Verificar se houve mudanças
    const annotationIds = Object.keys(currentState.annotations);
    const lastAnnotationIds = Object.keys(lastState.annotations);

    const hasChanges =
      annotationIds.length !== lastAnnotationIds.length ||
      annotationIds.some(
        (id) =>
          JSON.stringify(currentState.annotations[id]) !==
          JSON.stringify(lastState.annotations[id])
      );

    if (hasChanges) {
      // Adicionar estado anterior ao undo stack
      setUndoStack((prev) => {
        const newStack = [...prev, lastState];
        // Manter limite de histórico
        if (newStack.length > MAX_HISTORY) {
          return newStack.slice(newStack.length - MAX_HISTORY);
        }
        return newStack;
      });

      // Limpar redo stack quando nova ação é realizada
      setRedoStack([]);

      // Atualizar estado atual
      lastStateRef.current = currentState;
    }
  }, [annotationState?.byUid, annotationProvider, enabled, captureState]);

  // Restaurar anotações de um estado específico
  const restoreState = useCallback(
    (state: HistoryState) => {
      if (!annotationProvider) return;

      isRestoringRef.current = true;

      try {
        // Obter anotações atuais
        const currentAnnotations = annotationState?.byUid || {};

        // Remover anotações que não existem no estado a restaurar
        Object.keys(currentAnnotations).forEach((id) => {
          if (!(id in state.annotations)) {
            annotationProvider.deleteAnnotation(id);
          }
        });

        // Restaurar/atualizar anotações
        Object.entries(state.annotations).forEach(([id, annotation]) => {
          if (annotation) {
            // Se a anotação já existe, atualizá-la
            if (id in currentAnnotations) {
              // EmbedPDF não permite atualizar diretamente, então recreamos
              annotationProvider.deleteAnnotation(id);
            }

            // Recriar anotação com os dados anteriores
            try {
              const { object, pageIndex, ...rest } = annotation;
              if (object && pageIndex !== undefined) {
                annotationProvider.addAnnotation(pageIndex, {
                  ...object,
                  ...rest,
                });
              }
            } catch (error) {
              console.warn('Erro ao restaurar anotação:', error);
            }
          }
        });

        // Atualizar referência de estado
        lastStateRef.current = state;
      } finally {
        isRestoringRef.current = false;
      }
    },
    [annotationProvider, annotationState?.byUid]
  );

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    // Capturar estado atual antes de desfazer
    const currentState = captureState();
    if (!currentState) return;

    const previousState = undoStack[undoStack.length - 1];

    // Adicionar estado atual ao redo stack
    setRedoStack((prev) => [...prev, currentState]);

    // Remover do undo stack e restaurar
    setUndoStack((prev) => prev.slice(0, -1));
    restoreState(previousState);
  }, [undoStack, captureState, restoreState]);

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    // Capturar estado atual antes de refazer
    const currentState = captureState();
    if (!currentState) return;

    const nextState = redoStack[redoStack.length - 1];

    // Adicionar estado atual ao undo stack
    setUndoStack((prev) => [...prev, currentState]);

    // Remover do redo stack e restaurar
    setRedoStack((prev) => prev.slice(0, -1));
    restoreState(nextState);
  }, [redoStack, captureState, restoreState]);

  // Estados
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
  };
}
