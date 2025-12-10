import { useState, useEffect, useCallback } from 'react';
import { Copy, Highlighter, Underline, Strikethrough, Type, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSelectionCapability } from '@embedpdf/plugin-selection/react';
import { useAnnotation } from '@embedpdf/plugin-annotation/react';
import { useRedactionCapability } from '@embedpdf/plugin-redaction/react';
import { toast } from 'sonner';

// Simple ID generator for redaction items
const generateId = () => Math.random().toString(36).substring(2, 15);

export const TextContextMenu = () => {
  const { provides: selectionProvider } = useSelectionCapability();
  const { provides: annotationProvider } = useAnnotation();
  const { provides: redactionProvider } = useRedactionCapability();
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    if (!selectionProvider) return;

    // EventHook is a function that takes a listener and returns unsubscribe
    const unsubscribe = selectionProvider.onSelectionChange((selection) => {
      setHasSelection(!!selection);
    });

    return () => unsubscribe();
  }, [selectionProvider]);

  const handleCopy = useCallback(() => {
    if (!selectionProvider) return;
    selectionProvider.copyToClipboard();
    toast.success('Texto copiado!');
  }, [selectionProvider]);

  const handleHighlight = useCallback(async () => {
    if (!selectionProvider || !annotationProvider) return;
    
    const formatted = selectionProvider.getFormattedSelection();
    if (formatted.length === 0) return;

    // Set highlight tool and create annotation
    annotationProvider.setToolDefaults('highlight', { color: '#ffeb3b' });
    
    for (const selection of formatted) {
      // createAnnotation expects: (pageIndex, annotation, context?)
      annotationProvider.createAnnotation(selection.pageIndex, {
        subtype: 'Highlight',
        rect: selection.rect,
        quadPoints: selection.segmentRects,
        color: '#ffeb3b',
      } as any);
    }
    
    selectionProvider.clear();
    toast.success('Texto destacado!');
  }, [selectionProvider, annotationProvider]);

  const handleUnderline = useCallback(async () => {
    if (!selectionProvider || !annotationProvider) return;
    
    const formatted = selectionProvider.getFormattedSelection();
    if (formatted.length === 0) return;

    for (const selection of formatted) {
      annotationProvider.createAnnotation(selection.pageIndex, {
        subtype: 'Underline',
        rect: selection.rect,
        quadPoints: selection.segmentRects,
        color: '#2196f3',
      } as any);
    }
    
    selectionProvider.clear();
    toast.success('Texto sublinhado!');
  }, [selectionProvider, annotationProvider]);

  const handleStrikeout = useCallback(async () => {
    if (!selectionProvider || !annotationProvider) return;
    
    const formatted = selectionProvider.getFormattedSelection();
    if (formatted.length === 0) return;

    for (const selection of formatted) {
      annotationProvider.createAnnotation(selection.pageIndex, {
        subtype: 'StrikeOut',
        rect: selection.rect,
        quadPoints: selection.segmentRects,
        color: '#f44336',
      } as any);
    }
    
    selectionProvider.clear();
    toast.success('Texto riscado!');
  }, [selectionProvider, annotationProvider]);

  const handleSquiggly = useCallback(async () => {
    if (!selectionProvider || !annotationProvider) return;
    
    const formatted = selectionProvider.getFormattedSelection();
    if (formatted.length === 0) return;

    for (const selection of formatted) {
      annotationProvider.createAnnotation(selection.pageIndex, {
        subtype: 'Squiggly',
        rect: selection.rect,
        quadPoints: selection.segmentRects,
        color: '#4caf50',
      } as any);
    }
    
    selectionProvider.clear();
    toast.success('Sublinhado ondulado adicionado!');
  }, [selectionProvider, annotationProvider]);

  const handleRedact = useCallback(async () => {
    if (!selectionProvider || !redactionProvider) return;
    
    const formatted = selectionProvider.getFormattedSelection();
    if (formatted.length === 0) return;

    // Use addPending to add redaction items
    const redactionItems = formatted.map((selection) => ({
      id: generateId(),
      kind: 'text' as const,
      page: selection.pageIndex,
      rect: selection.rect,
      rects: selection.segmentRects,
    }));
    
    redactionProvider.addPending(redactionItems);
    
    selectionProvider.clear();
    toast.success('Área marcada para censura. Clique em "Aplicar" para confirmar.');
  }, [selectionProvider, redactionProvider]);

  if (!hasSelection) return null;

  return (
    <div 
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl p-1 flex items-center gap-0.5"
      style={{
        left: '50%',
        top: '120px',
        transform: 'translateX(-50%)',
      }}
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Copiar</p></TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-500 hover:text-yellow-600" onClick={handleHighlight}>
              <Highlighter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Destacar</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={handleUnderline}>
              <Underline className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Sublinhar</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={handleStrikeout}>
              <Strikethrough className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Riscado</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600" onClick={handleSquiggly}>
              <Type className="h-4 w-4" style={{ textDecoration: 'underline wavy' }} />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Sublinhado ondulado</p></TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={handleRedact}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Censurar</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
