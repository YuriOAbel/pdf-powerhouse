import { motion } from 'framer-motion';
import { 
  MousePointer2, 
  Type, 
  Highlighter, 
  Pencil, 
  Eraser, 
  Image, 
  Stamp,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore, Tool } from '@/store/editorStore';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
  tool: Tool;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton = ({ icon, label, isActive, onClick }: ToolButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          "relative transition-all duration-200",
          isActive && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
        )}
      >
        {icon}
        {isActive && (
          <motion.div
            layoutId="activeToolIndicator"
            className="absolute inset-0 rounded-md bg-primary -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

interface EditorToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onDownload: () => void;
}

export const EditorToolbar = ({ onUndo, onRedo, onSave, onDownload }: EditorToolbarProps) => {
  const { 
    activeTool, 
    setActiveTool, 
    zoom, 
    setZoom,
    canUndo,
    canRedo 
  } = useEditorStore();

  const tools: { tool: Tool; icon: React.ReactNode; label: string }[] = [
    { tool: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Selecionar' },
    { tool: 'text', icon: <Type className="w-4 h-4" />, label: 'Texto' },
    { tool: 'highlight', icon: <Highlighter className="w-4 h-4" />, label: 'Destacar' },
    { tool: 'draw', icon: <Pencil className="w-4 h-4" />, label: 'Desenhar' },
    { tool: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Apagar' },
    { tool: 'stamp', icon: <Stamp className="w-4 h-4" />, label: 'Carimbo' },
    { tool: 'image', icon: <Image className="w-4 h-4" />, label: 'Imagem' },
  ];

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 300));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 25));

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 px-4 py-2 bg-card border-b border-border"
    >
      {/* Left section - Tools */}
      <div className="flex items-center gap-1">
        {tools.map((t) => (
          <ToolButton
            key={t.tool}
            tool={t.tool}
            icon={t.icon}
            label={t.label}
            isActive={activeTool === t.tool}
            onClick={() => setActiveTool(t.tool)}
          />
        ))}
      </div>

      {/* Center section - Zoom & History */}
      <div className="flex items-center gap-2">
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Diminuir zoom</TooltipContent>
          </Tooltip>
          
          <span className="text-sm font-medium text-muted-foreground min-w-[4rem] text-center">
            {zoom}%
          </span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aumentar zoom</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desfazer</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refazer</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSave} className="gap-2">
          <Save className="w-4 h-4" />
          Salvar
        </Button>
        <Button size="sm" onClick={onDownload} className="gap-2 bg-gradient-hero hover:opacity-90">
          <Download className="w-4 h-4" />
          Baixar
        </Button>
      </div>
    </motion.div>
  );
};
