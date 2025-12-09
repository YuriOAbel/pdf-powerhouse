import { useEffect, useRef } from 'react';
import { Canvas, FabricImage } from 'fabric';
import { useEditorStore } from '@/store/editorStore';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface PDFCanvasProps {
  pageImage: string | null;
  fabricCanvasRef: React.MutableRefObject<Canvas | null>;
}

export const PDFCanvas = ({ pageImage, fabricCanvasRef }: PDFCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeTool, 
    brushColor, 
    brushSize, 
    highlightColor,
    zoom,
    isLoading,
    setCanUndo,
  } = useEditorStore();

  // Inicializar canvas quando a imagem da página estiver disponível
  useEffect(() => {
    if (!canvasRef.current || !pageImage) return;
    
    // Se já existe um canvas, limpar para recriar com novo tamanho
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    // Carregar imagem primeiro para obter dimensões
    FabricImage.fromURL(pageImage).then((img) => {
      if (!img || !canvasRef.current) return;
      
      const imgWidth = img.width || 800;
      const imgHeight = img.height || 600;
      
      // Calcular dimensões do canvas baseado no zoom
      const scale = (zoom / 100);
      const canvasWidth = imgWidth * scale;
      const canvasHeight = imgHeight * scale;
      
      // Criar canvas com dimensões da imagem
      const canvas = new Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#ffffff',
      });

      // Configurar imagem como fundo
      img.scaleToWidth(canvasWidth);
      img.set({
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top',
      });
      
      canvas.backgroundImage = img;
      canvas.renderAll();

      // Configurar brush
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
      }
      
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

  // Atualizar ferramentas
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
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
      }
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
      <div className="pdf-canvas-container shadow-xl rounded-lg overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </motion.div>
  );
};
