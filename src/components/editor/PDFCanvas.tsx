import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/store/editorStore';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface PDFCanvasProps {
  pageImage: string | null;
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
  onCanvasClick?: (point: { x: number; y: number }) => void;
  pendingAction?: 'text' | 'stamp' | 'note' | null;
}

export const PDFCanvas = ({ pageImage, fabricCanvasRef, onCanvasClick, pendingAction }: PDFCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeTool, 
    drawSettings,
    highlightColor,
    zoom,
    isLoading,
    setCanUndo,
  } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current || !pageImage) return;
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    fabric.Image.fromURL(pageImage, (img) => {
      if (!img || !canvasRef.current) return;
      const imgWidth = img.width || 800;
      const imgHeight = img.height || 600;
      const scale = (zoom / 100);
      const canvasWidth = imgWidth * scale;
      const canvasHeight = imgHeight * scale;
      
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#ffffff',
      });

      img.scaleToWidth(canvasWidth);
      img.set({ left: 0, top: 0, originX: 'left', originY: 'top' });
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = drawSettings.strokeColor;
        canvas.freeDrawingBrush.width = drawSettings.strokeWidth;
      }
      
      canvas.on('mouse:down', (opt) => {
        if (onCanvasClick && pendingAction) {
          const pointer = canvas.getPointer(opt.e);
          onCanvasClick({ x: pointer.x, y: pointer.y });
        }
      });

      fabricCanvasRef.current = canvas;
      canvas.on('object:added', () => setCanUndo(true));
    });

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [pageImage, zoom]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'draw' || activeTool === 'highlight';
    canvas.selection = activeTool === 'select';

    if (canvas.freeDrawingBrush) {
      if (activeTool === 'highlight') {
        canvas.freeDrawingBrush.color = highlightColor + '80';
        canvas.freeDrawingBrush.width = 20;
      } else {
        canvas.freeDrawingBrush.color = drawSettings.strokeColor;
        canvas.freeDrawingBrush.width = drawSettings.strokeWidth;
        (canvas.freeDrawingBrush as any).opacity = drawSettings.opacity / 100;
      }
    }
  }, [activeTool, drawSettings, highlightColor]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Skeleton className="w-full max-w-2xl aspect-[3/4] rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      ref={containerRef}
      className={`flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto bg-muted/30 ${
        pendingAction ? 'cursor-crosshair' : ''
      }`}
    >
      {pendingAction && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium z-30 shadow-lg">
          Toque no PDF para inserir
        </div>
      )}
      <div className="pdf-canvas-container shadow-xl rounded-lg overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </motion.div>
  );
};
