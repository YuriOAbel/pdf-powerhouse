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

  return (
    <AnimatePresence>
      {showToolPanel && activeTool !== 'select' && activeTool !== 'eraser' && (
        <>
          {/* Backdrop - mobile only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setShowToolPanel(false)}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl shadow-lg max-h-[70vh] overflow-y-auto
                       md:absolute md:top-full md:bottom-auto md:left-4 md:right-auto md:mt-2 md:rounded-xl md:max-h-[500px] md:w-80 md:border"
          >
            {/* Handle for mobile */}
            <div className="flex justify-center pt-2 md:hidden">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="sticky top-0 bg-card flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{getPanelTitle(activeTool)}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowToolPanel(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {renderPanel()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
