import { useState, useRef, useEffect } from 'react';
import { 
  Type, 
  Pencil, 
  Circle, 
  Square, 
  ArrowRight, 
  Highlighter,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize,
  EyeOff,
  MoreHorizontal,
  Image,
  MessageSquare,
  Settings2,
  StickyNote,
  Download,
  CheckCircle,
  Undo2,
  Redo2,
  Underline,
  Strikethrough
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAnnotation } from '@embedpdf/plugin-annotation/react';
import { useZoomCapability } from '@embedpdf/plugin-zoom/react';
import { useRedactionCapability } from '@embedpdf/plugin-redaction/react';
import { usePan } from '@embedpdf/plugin-pan/react';
import { useExportCapability } from '@embedpdf/plugin-export/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { PanelType } from './PDFEditorNPM';
import { useEditorStore } from '@/store/editorStore';

type EditorMode = 'select' | 'pan' | 'annotate' | 'redact';

interface EditorToolbarProps {
  leftPanel: PanelType;
  rightPanel: PanelType;
  onToggleLeft: (panel: PanelType) => void;
  onToggleRight: (panel: PanelType) => void;
}

export const EditorToolbar = ({ leftPanel, rightPanel, onToggleLeft, onToggleRight }: EditorToolbarProps) => {
  const [mode, setMode] = useState<EditorMode>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pdfFile } = useEditorStore();
  
  // Hooks from EmbedPDF
  const { state: annotationState, provides: annotationProvider } = useAnnotation();
  const { provides: zoomProvider } = useZoomCapability();
  const { provides: redactionProvider } = useRedactionCapability();
  const { provides: panProvider, isPanning } = usePan();
  const { provides: exportProvider } = useExportCapability();

  // Undo/Redo hook (leverages EmbedPDF's HistoryPlugin)
  const { canUndo, canRedo, handleUndo: historyUndo, handleRedo: historyRedo } = useUndoRedo();

  // Wrapped handlers with toast notifications
  const handleUndo = () => {
    historyUndo();
    toast.success('Desfeito');
  };

  const handleRedo = () => {
    historyRedo();
    toast.success('Refeito');
  };

  const activeTool = annotationState?.activeToolId;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          handleUndo();
        }
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo]);

  // Deactivate Pan when selecting a tool
  const deactivatePan = () => {
    if (isPanning && panProvider) {
      panProvider.disablePan();
    }
  };

  // Tool handlers
  const handleSelectTool = (toolId: string | null) => {
    if (!annotationProvider) return;
    
    // Deactivate redaction if active
    if (redactionProvider?.isMarqueeRedactActive()) {
      redactionProvider.endRedaction();
    }
    
    // Deactivate pan
    deactivatePan();
    
    const isActive = activeTool === toolId;
    annotationProvider.setActiveTool(isActive ? null : toolId);
    setMode(toolId ? 'annotate' : 'select');
  };

  const handlePanMode = () => {
    // Deactivate annotation tools
    annotationProvider?.setActiveTool(null);
    
    // Deactivate redaction
    if (redactionProvider?.isMarqueeRedactActive()) {
      redactionProvider.endRedaction();
    }
    
    // Toggle pan
    if (panProvider) {
      if (isPanning) {
        panProvider.disablePan();
        setMode('select');
      } else {
        panProvider.enablePan();
        setMode('pan');
      }
    }
  };

  const handleSelectMode = () => {
    annotationProvider?.setActiveTool(null);
    if (redactionProvider?.isMarqueeRedactActive()) {
      redactionProvider.endRedaction();
    }
    deactivatePan();
    setMode('select');
  };

  const handleRedactionMode = () => {
    if (!redactionProvider) return;
    
    // Deactivate annotation tools
    annotationProvider?.setActiveTool(null);
    deactivatePan();
    
    if (redactionProvider.isMarqueeRedactActive()) {
      redactionProvider.endRedaction();
      setMode('select');
    } else {
      redactionProvider.enableMarqueeRedact();
      setMode('redact');
    }
  };

  const handleCommitRedactions = async () => {
    if (!redactionProvider) return;
    const task = redactionProvider.commitAllPending();
    await task.toPromise();
    toast.success('Censuras aplicadas!');
  };

  // Image stamp handler
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !annotationProvider) return;
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = () => {
      const imageSrc = reader.result as string;
      
      // Set stamp tool with image
      annotationProvider.setToolDefaults('stamp', {
        imageSrc,
        imageSize: { width: 150, height: 150 },
      });
      annotationProvider.setActiveTool('stamp');
      setMode('annotate');
      deactivatePan();
      
      toast.success('Clique no PDF para inserir a imagem');
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  // Export handler
  const handleExport = async () => {
    if (!exportProvider) {
      toast.error('Exportação não disponível');
      return;
    }
    
    try {
      exportProvider.download();
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  // Zoom handlers
  const handleZoomIn = () => zoomProvider?.zoomIn();
  const handleZoomOut = () => zoomProvider?.zoomOut();
  const handleFitWidth = () => zoomProvider?.requestZoom('fit-width' as any);
  const handleFitPage = () => zoomProvider?.requestZoom('fit-page' as any);

  // Panel handlers
  const handleOpenProperties = () => {
    onToggleLeft(leftPanel === 'properties' ? 'none' : 'properties');
  };

  const handleOpenComments = () => {
    onToggleRight(rightPanel === 'comments' ? 'none' : 'comments');
  };

  const isToolActive = (toolId: string) => activeTool === toolId;
  const isRedacting = mode === 'redact';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-card overflow-x-auto">
        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                className="h-9 w-9 p-0"
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Desfazer</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                className="h-9 w-9 p-0"
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Refazer</p></TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Selection / Pan Mode */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={mode === 'select' && !activeTool && !isPanning}
                onPressedChange={handleSelectMode}
                size="sm"
                aria-label="Selecionar"
                className={`h-9 w-9 p-0 ${mode === 'select' && !activeTool && !isPanning ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <MousePointer2 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Selecionar</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isPanning}
                onPressedChange={handlePanMode}
                size="sm"
                aria-label="Mover"
                className={`h-9 w-9 p-0 ${isPanning ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Hand className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Mover</p></TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Annotation Tools */}
        <div className="hidden sm:flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('freeText')}
                onPressedChange={() => handleSelectTool('freeText')}
                size="sm"
                aria-label="Texto"
                className={`h-9 w-9 p-0 ${isToolActive('freeText') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Type className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Texto</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('ink')}
                onPressedChange={() => handleSelectTool('ink')}
                size="sm"
                aria-label="Desenho livre"
                className={`h-9 w-9 p-0 ${isToolActive('ink') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Pencil className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Desenho livre</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('highlight')}
                onPressedChange={() => handleSelectTool('highlight')}
                size="sm"
                aria-label="Destacar"
                className={`h-9 w-9 p-0 ${isToolActive('highlight') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Highlighter className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Destacar</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('underline')}
                onPressedChange={() => handleSelectTool('underline')}
                size="sm"
                aria-label="Sublinhar"
                className={`h-9 w-9 p-0 ${isToolActive('underline') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Underline className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Sublinhar</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('strikeout')}
                onPressedChange={() => handleSelectTool('strikeout')}
                size="sm"
                aria-label="Riscado"
                className={`h-9 w-9 p-0 ${isToolActive('strikeout') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Strikethrough className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Riscado</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('note')}
                onPressedChange={() => handleSelectTool('note')}
                size="sm"
                aria-label="Nota"
                className={`h-9 w-9 p-0 ${isToolActive('note') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <StickyNote className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Nota adesiva</p></TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Shapes */}
        <div className="hidden sm:flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('square')}
                onPressedChange={() => handleSelectTool('square')}
                size="sm"
                aria-label="Retângulo"
                className={`h-9 w-9 p-0 ${isToolActive('square') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Square className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Retângulo</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('circle')}
                onPressedChange={() => handleSelectTool('circle')}
                size="sm"
                aria-label="Círculo"
                className={`h-9 w-9 p-0 ${isToolActive('circle') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Circle className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Elipse</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('lineArrow')}
                onPressedChange={() => handleSelectTool('lineArrow')}
                size="sm"
                aria-label="Seta"
                className={`h-9 w-9 p-0 ${isToolActive('lineArrow') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <ArrowRight className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Seta</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isToolActive('stamp')}
                onPressedChange={handleImageClick}
                size="sm"
                aria-label="Imagem"
                className={`h-9 w-9 p-0 ${isToolActive('stamp') ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' : ''}`}
              >
                <Image className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Inserir imagem</p></TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Redaction */}
        <div className="hidden sm:flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isRedacting}
                onPressedChange={handleRedactionMode}
                size="sm"
                aria-label="Censurar"
                className={cn(
                  "h-9 w-9 p-0",
                  isRedacting && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
              >
                <EyeOff className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Censurar</p></TooltipContent>
          </Tooltip>
          
          {isRedacting && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCommitRedactions}
                  className="h-9 gap-1 px-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden md:inline">Aplicar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Aplicar censuras permanentemente</p></TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex-1" />

        {/* Panel toggles */}
        <div className="hidden md:flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={leftPanel === 'properties'}
                onPressedChange={handleOpenProperties}
                size="sm"
                aria-label="Propriedades"
                className="h-9 w-9 p-0"
              >
                <Settings2 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Propriedades</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={rightPanel === 'comments'}
                onPressedChange={handleOpenComments}
                size="sm"
                aria-label="Comentários"
                className="h-9 w-9 p-0"
              >
                <MessageSquare className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent><p>Comentários</p></TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden md:block" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-9 w-9 p-0"
                aria-label="Diminuir zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Diminuir zoom</p></TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-9 w-9 p-0"
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Aumentar zoom</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    aria-label="Mais opções de zoom"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleFitWidth}>
                    Ajustar à largura
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFitPage}>
                    Ajustar à página
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => zoomProvider?.requestZoom(0.5)}>
                    50%
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => zoomProvider?.requestZoom(0.75)}>
                    75%
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => zoomProvider?.requestZoom(1)}>
                    100%
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => zoomProvider?.requestZoom(1.5)}>
                    150%
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => zoomProvider?.requestZoom(2)}>
                    200%
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent><p>Opções de zoom</p></TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Export */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              className="h-9 gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Exportar PDF</p></TooltipContent>
        </Tooltip>

        {/* More Options (Mobile) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 sm:hidden"
              aria-label="Mais opções"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSelectTool('freeText')}>
              <Type className="h-4 w-4 mr-2" />
              Texto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelectTool('ink')}>
              <Pencil className="h-4 w-4 mr-2" />
              Desenho livre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelectTool('highlight')}>
              <Highlighter className="h-4 w-4 mr-2" />
              Destacar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelectTool('underline')}>
              <Underline className="h-4 w-4 mr-2" />
              Sublinhar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelectTool('strikeout')}>
              <Strikethrough className="h-4 w-4 mr-2" />
              Riscado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelectTool('note')}>
              <StickyNote className="h-4 w-4 mr-2" />
              Nota
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSelectTool('square')}>
              <Square className="h-4 w-4 mr-2" />
              Retângulo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelectTool('circle')}>
              <Circle className="h-4 w-4 mr-2" />
              Elipse
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelectTool('lineArrow')}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Seta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImageClick}>
              <Image className="h-4 w-4 mr-2" />
              Imagem
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRedactionMode}>
              <EyeOff className="h-4 w-4 mr-2" />
              {isRedacting ? 'Desativar censura' : 'Censurar'}
            </DropdownMenuItem>
            {isRedacting && (
              <DropdownMenuItem onClick={handleCommitRedactions}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aplicar censuras
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleOpenProperties}>
              <Settings2 className="h-4 w-4 mr-2" />
              Propriedades
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenComments}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentários
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};
