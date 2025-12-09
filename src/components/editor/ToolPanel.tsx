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
      {/* Backdrop - tap to close */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-[100]"
        onClick={() => setShowToolPanel(false)}
      />
      
      {/* Floating Lateral Panel - Side-by-side style */}
      <motion.div
        key="panel"
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="fixed z-[101] bg-card border border-border rounded-xl shadow-2xl overflow-hidden
                   left-2 right-2 top-[140px] max-w-[70vw] mx-auto
                   sm:left-4 sm:right-auto sm:top-[130px] sm:max-w-[320px] sm:mx-0
                   md:left-[80px] md:top-[120px] md:max-w-[360px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-base text-foreground">{getPanelTitle(activeTool)}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowToolPanel(false)}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
          {renderPanel()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
