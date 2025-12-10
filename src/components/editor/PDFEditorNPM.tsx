import { useMemo, useCallback, useState, useEffect } from 'react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { EmbedPDF } from '@embedpdf/core/react';
import { createPluginRegistration } from '@embedpdf/core';
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/react';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/react';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader/react';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react';
import { ZoomPluginPackage, ZoomMode, useZoomCapability } from '@embedpdf/plugin-zoom/react';
import { ExportPluginPackage } from '@embedpdf/plugin-export/react';
import { AnnotationLayer, AnnotationPluginPackage, useAnnotation } from '@embedpdf/plugin-annotation/react';
import { RedactionLayer, RedactionPluginPackage } from '@embedpdf/plugin-redaction/react';
import { InteractionManagerPluginPackage, GlobalPointerProvider, PagePointerProvider } from '@embedpdf/plugin-interaction-manager/react';
import { PanPluginPackage } from '@embedpdf/plugin-pan/react';
import { SelectionPluginPackage, SelectionLayer } from '@embedpdf/plugin-selection/react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EditorToolbar } from './EditorToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { CommentsPanel } from './CommentsPanel';
import { PageNavigator } from './PageNavigator';
import { TextContextMenu } from './TextContextMenu';

interface PDFEditorNPMProps {
  pdfUrl: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export type RightPanelType = 'none' | 'properties' | 'comments';

// Inner component to access hooks inside EmbedPDF context
const PDFEditorContent = ({ 
  rightPanel, 
  setRightPanel,
  pluginsReady 
}: { 
  rightPanel: RightPanelType;
  setRightPanel: (panel: RightPanelType) => void;
  pluginsReady: boolean;
}) => {
  const { state: annotationState } = useAnnotation();
  const { provides: zoomProvider } = useZoomCapability();

  // Auto-open properties panel when a tool with configurable properties is selected
  useEffect(() => {
    const toolsWithProperties = ['freeText', 'ink', 'highlight', 'underline', 'strikeout', 'squiggly', 'square', 'circle', 'lineArrow', 'note', 'stamp'];
    
    if (annotationState?.activeToolId && toolsWithProperties.includes(annotationState.activeToolId)) {
      setRightPanel('properties');
    }
  }, [annotationState?.activeToolId, setRightPanel]);

  // Adjust zoom when panel opens to prevent PDF from being cut off
  const togglePanel = useCallback((panel: RightPanelType) => {
    const newPanel = rightPanel === panel ? 'none' : panel;
    setRightPanel(newPanel);
    
    // When opening a panel, adjust zoom after layout change
    if (newPanel !== 'none' && zoomProvider) {
      setTimeout(() => {
        zoomProvider.requestZoom('fit-width' as any);
      }, 150);
    }
  }, [rightPanel, setRightPanel, zoomProvider]);

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      {/* Custom Toolbar */}
      <EditorToolbar 
        rightPanel={rightPanel}
        onTogglePanel={togglePanel}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewport */}
        {!pluginsReady ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-[300px] h-[400px] rounded-lg" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Carregando documento...
              </p>
            </div>
          </div>
        ) : (
          <GlobalPointerProvider>
            <div className="flex-1 relative min-w-0">
              <Viewport 
                className="h-full w-full bg-muted/50"
                style={{ minHeight: 0 }}
              >
                <Scroller
                  renderPage={({ pageIndex, scale, width, height, rotation }) => (
                    <PagePointerProvider
                      pageIndex={pageIndex}
                      pageWidth={width}
                      pageHeight={height}
                      rotation={rotation}
                      scale={scale}
                    >
                      <div 
                        style={{ width, height, position: 'relative' }}
                        className="shadow-lg bg-white"
                      >
                        <RenderLayer 
                          pageIndex={pageIndex} 
                          style={{ pointerEvents: 'none' }}
                        />
                        <SelectionLayer 
                          pageIndex={pageIndex} 
                          scale={scale}
                        />
                        <AnnotationLayer 
                          pageIndex={pageIndex} 
                          scale={scale}
                          pageWidth={width}
                          pageHeight={height}
                          rotation={rotation}
                        />
                        <RedactionLayer 
                          pageIndex={pageIndex} 
                          scale={scale} 
                          rotation={rotation} 
                        />
                      </div>
                    </PagePointerProvider>
                  )}
                />
              </Viewport>
              
              {/* Page Navigator */}
              <PageNavigator />
              
              {/* Text Selection Context Menu */}
              <TextContextMenu />
            </div>
          </GlobalPointerProvider>
        )}
        
        {/* Right Panel */}
        {rightPanel === 'properties' && <PropertiesPanel onClose={() => setRightPanel('none')} />}
        {rightPanel === 'comments' && <CommentsPanel onClose={() => setRightPanel('none')} />}
      </div>
    </div>
  );
};

export const PDFEditorNPM = ({ 
  pdfUrl, 
  onLoad, 
  onError 
}: PDFEditorNPMProps) => {
  const { engine, isLoading: engineLoading, error: engineError } = usePdfiumEngine();
  const [rightPanel, setRightPanel] = useState<RightPanelType>('none');

  // Register all required plugins
  const plugins = useMemo(() => [
    createPluginRegistration(LoaderPluginPackage, {
      loadingOptions: {
        type: 'url',
        pdfFile: { id: 'user-pdf', url: pdfUrl },
      },
    }),
    createPluginRegistration(ViewportPluginPackage, { 
      viewportGap: 10 
    }),
    createPluginRegistration(ScrollPluginPackage),
    createPluginRegistration(RenderPluginPackage),
    createPluginRegistration(ZoomPluginPackage, { 
      defaultZoomLevel: ZoomMode.FitWidth,
      minZoom: 0.25,
      maxZoom: 4,
    }),
    createPluginRegistration(InteractionManagerPluginPackage),
    createPluginRegistration(PanPluginPackage),
    createPluginRegistration(SelectionPluginPackage),
    createPluginRegistration(AnnotationPluginPackage, {
      autoCommit: true,
      deactivateToolAfterCreate: false,
      selectAfterCreate: true,
    }),
    createPluginRegistration(RedactionPluginPackage, {
      drawBlackBoxes: true,
    }),
    createPluginRegistration(ExportPluginPackage),
  ], [pdfUrl]);

  const handleInitialized = useCallback(async () => {
    console.log('EmbedPDF initialized with plugins');
    onLoad?.();
  }, [onLoad]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Engine error
  if (engineError) {
    onError?.(new Error(engineError.message));
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3">
            <span>Erro ao inicializar o motor PDF: {engineError.message}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="w-fit gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Engine loading
  if (engineLoading || !engine) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-[300px] h-[400px] rounded-lg" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Inicializando motor PDF...
          </p>
        </div>
      </div>
    );
  }

  return (
    <EmbedPDF 
      engine={engine} 
      plugins={plugins}
      onInitialized={handleInitialized}
    >
      {({ pluginsReady }) => (
        <PDFEditorContent 
          rightPanel={rightPanel}
          setRightPanel={setRightPanel}
          pluginsReady={pluginsReady}
        />
      )}
    </EmbedPDF>
  );
};
