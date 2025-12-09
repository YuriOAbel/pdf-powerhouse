import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorStore, Tool } from '@/store/editorStore';
import { TextToolPanel } from './panels/TextToolPanel';
import { DrawToolPanel } from './panels/DrawToolPanel';
import { ImageToolPanel } from './panels/ImageToolPanel';
import { StampToolPanel } from './panels/StampToolPanel';
import { NoteToolPanel } from './panels/NoteToolPanel';
import { HighlightToolPanel } from './panels/HighlightToolPanel';

interface ToolPanelProps {
  onImageSelect: (file: File) => void;
  onAddText: () => void;
  onAddStamp: () => void;
  onAddNote: () => void;
}

export const ToolPanel = ({ onImageSelect, onAddText, onAddStamp, onAddNote }: ToolPanelProps) => {
  const { activeTool, showToolPanel, setShowToolPanel } = useEditorStore();

  const getPanelTitle = (tool: Tool) => {
    const titles: Record<Tool, string> = {
      select: '',
      text: 'Inserir Texto',
      highlight: 'Destacar',
      draw: 'Desenhar',
      eraser: '',
      stamp: 'Carimbo',
      image: 'Inserir Imagem',
      note: 'Adicionar Nota',
    };
    return titles[tool];
  };

  const renderPanel = () => {
    switch (activeTool) {
      case 'text':
        return <TextToolPanel onConfirm={onAddText} />;
      case 'draw':
        return <DrawToolPanel />;
      case 'highlight':
        return <HighlightToolPanel />;
      case 'image':
        return <ImageToolPanel onImageSelect={onImageSelect} />;
      case 'stamp':
        return <StampToolPanel onConfirm={onAddStamp} />;
      case 'note':
        return <NoteToolPanel onConfirm={onAddNote} />;
      default:
        return null;
    }
  };

  const shouldShowPanel = showToolPanel && activeTool !== 'select' && activeTool !== 'eraser';

  if (!shouldShowPanel) return null;

  return (
    <AnimatePresence mode="wait">
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[100]"
        onClick={() => setShowToolPanel(false)}
      />
      
      {/* Panel - Bottom sheet on mobile, centered modal on desktop */}
      <motion.div
        key="panel"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[101] bg-card border-t border-border rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden
                   md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:max-h-[600px] md:w-96 md:border"
      >
        {/* Handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-muted-foreground/40 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="sticky top-0 bg-card flex items-center justify-between px-4 py-3 border-b border-border z-10">
          <h3 className="font-semibold text-lg text-foreground">{getPanelTitle(activeTool)}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowToolPanel(false)}
            className="h-9 w-9 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] md:max-h-[calc(600px-80px)]">
          {renderPanel()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
