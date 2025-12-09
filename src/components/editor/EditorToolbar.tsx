import { useState } from 'react';
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
  MoreHorizontal
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
import { useAnnotation, useAnnotationCapability } from '@embedpdf/plugin-annotation/react';
import { useZoomCapability } from '@embedpdf/plugin-zoom/react';
import { useRedactionCapability } from '@embedpdf/plugin-redaction/react';
import { cn } from '@/lib/utils';

type EditorMode = 'select' | 'pan' | 'annotate' | 'redact';

export const EditorToolbar = () => {
  const [mode, setMode] = useState<EditorMode>('select');
  
  // Hooks from EmbedPDF
  const { state: annotationState, provides: annotationProvider } = useAnnotation();
  const { provides: zoomProvider } = useZoomCapability();
  const { provides: redactionProvider } = useRedactionCapability();

  const activeTool = annotationState?.activeToolId;

  // Tool handlers
  const handleSelectTool = (toolId: string | null) => {
    if (!annotationProvider) return;
    
    // Deactivate redaction if active
    if (redactionProvider?.isMarqueeRedactActive()) {
      redactionProvider.endRedaction();
    }
    
    const isActive = activeTool === toolId;
    annotationProvider.setActiveTool(isActive ? null : toolId);
    setMode(toolId ? 'annotate' : 'select');
  };

  const handleRedactionMode = () => {
    if (!redactionProvider) return;
    
    // Deactivate annotation tools
    annotationProvider?.setActiveTool(null);
    
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
  };

  // Zoom handlers
  const handleZoomIn = () => zoomProvider?.zoomIn();
  const handleZoomOut = () => zoomProvider?.zoomOut();
  const handleFitWidth = () => zoomProvider?.requestZoom('fit-width' as any);
  const handleFitPage = () => zoomProvider?.requestZoom('fit-page' as any);

  const isToolActive = (toolId: string) => activeTool === toolId;
  const isRedacting = mode === 'redact';

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-card overflow-x-auto">
      {/* Selection / Pan Mode */}
      <div className="flex items-center gap-0.5">
        <Toggle
          pressed={mode === 'select' && !activeTool}
          onPressedChange={() => {
            annotationProvider?.setActiveTool(null);
            redactionProvider?.endRedaction();
            setMode('select');
          }}
          size="sm"
          aria-label="Selecionar"
          className="h-9 w-9 p-0"
        >
          <MousePointer2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={mode === 'pan'}
          onPressedChange={() => {
            annotationProvider?.setActiveTool(null);
            redactionProvider?.endRedaction();
            setMode('pan');
          }}
          size="sm"
          aria-label="Mover"
          className="h-9 w-9 p-0"
        >
          <Hand className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Annotation Tools */}
      <div className="flex items-center gap-0.5">
        <Toggle
          pressed={isToolActive('freeText')}
          onPressedChange={() => handleSelectTool('freeText')}
          size="sm"
          aria-label="Texto"
          className="h-9 w-9 p-0"
        >
          <Type className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          pressed={isToolActive('ink')}
          onPressedChange={() => handleSelectTool('ink')}
          size="sm"
          aria-label="Desenho livre"
          className="h-9 w-9 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Toggle>

        <Toggle
          pressed={isToolActive('highlight')}
          onPressedChange={() => handleSelectTool('highlight')}
          size="sm"
          aria-label="Destacar"
          className="h-9 w-9 p-0"
        >
          <Highlighter className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Shapes */}
      <div className="flex items-center gap-0.5">
        <Toggle
          pressed={isToolActive('square')}
          onPressedChange={() => handleSelectTool('square')}
          size="sm"
          aria-label="Retângulo"
          className="h-9 w-9 p-0"
        >
          <Square className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          pressed={isToolActive('circle')}
          onPressedChange={() => handleSelectTool('circle')}
          size="sm"
          aria-label="Elipse"
          className="h-9 w-9 p-0"
        >
          <Circle className="h-4 w-4" />
        </Toggle>

        <Toggle
          pressed={isToolActive('lineArrow')}
          onPressedChange={() => handleSelectTool('lineArrow')}
          size="sm"
          aria-label="Seta"
          className="h-9 w-9 p-0"
        >
          <ArrowRight className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Redaction */}
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

      <div className="flex-1" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="h-9 w-9 p-0"
          aria-label="Diminuir zoom"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="h-9 w-9 p-0"
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

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
      </div>

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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleRedactionMode}>
            <EyeOff className="h-4 w-4 mr-2" />
            {isRedacting ? 'Desativar censura' : 'Censurar'}
          </DropdownMenuItem>
          {isRedacting && (
            <DropdownMenuItem onClick={handleCommitRedactions}>
              Aplicar censuras
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
