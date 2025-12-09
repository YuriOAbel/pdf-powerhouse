import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useEditorStore } from '@/store/editorStore';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface PDFCanvasProps {
  pageImage: string | null;
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

export const PDFCanvas = ({ pageImage, fabricCanvasRef }: PDFCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeTool, 
    brushColor, 
    brushSize, 
    highlightColor,
    textColor,
    fontSize,
    zoom,
    isLoading,
    setCanUndo,
  } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushSize;
    fabricCanvasRef.current = canvas;

    canvas.on('object:added', () => setCanUndo(true));

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !pageImage) return;

    fabric.Image.fromURL(pageImage, (img) => {
      if (!img || !canvas) return;
      const scale = Math.min(800 / (img.width || 800), 600 / (img.height || 600)) * (zoom / 100);
      img.scaleToWidth((img.width || 800) * scale);
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
  }, [pageImage, zoom]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'draw' || activeTool === 'highlight';
    canvas.selection = activeTool === 'select';

    if (activeTool === 'highlight') {
      canvas.freeDrawingBrush.color = highlightColor + '80';
      canvas.freeDrawingBrush.width = 20;
    } else {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [activeTool, brushColor, brushSize, highlightColor]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Skeleton className="w-full max-w-2xl aspect-[3/4] rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      ref={containerRef}
      className="flex-1 flex items-center justify-center p-8 overflow-auto bg-muted/30"
    >
      <div className="pdf-canvas-container shadow-xl">
        <canvas ref={canvasRef} className="pdf-page" />
      </div>
    </motion.div>
  );
};
