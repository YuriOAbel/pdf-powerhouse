import { useMemo, useCallback, useState, useEffect } from 'react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { EmbedPDF } from '@embedpdf/core/react';
import { createPluginRegistration } from '@embedpdf/core';
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/react';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/react';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader/react';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react';
import { ZoomPluginPackage, ZoomMode, useZoomCapability } from '@embedpdf/plugin-zoom/react';
import { ExportPluginPackage, useExportCapability } from '@embedpdf/plugin-export/react';
import { HistoryPluginPackage } from '@embedpdf/plugin-history/react';
import { AnnotationLayer, AnnotationPluginPackage, useAnnotation } from '@embedpdf/plugin-annotation/react';
import { RedactionLayer, RedactionPluginPackage } from '@embedpdf/plugin-redaction/react';
import { InteractionManagerPluginPackage, GlobalPointerProvider, PagePointerProvider } from '@embedpdf/plugin-interaction-manager/react';
import { PanPluginPackage } from '@embedpdf/plugin-pan/react';
import { SelectionPluginPackage, SelectionLayer } from '@embedpdf/plugin-selection/react';
import { ThumbnailPluginPackage } from '@embedpdf/plugin-thumbnail/react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { EditorToolbar } from './EditorToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { CommentsPanel } from './CommentsPanel';
import { ThumbnailsSidebar } from './ThumbnailsSidebar';
import { PageNavigator } from './PageNavigator';
import { ExportModal } from './ExportModal';
import { toast } from 'sonner';
import { convertPdfToImages, downloadAllImages } from '@/lib/convertPdfToImage';
import { convertPdfToWord, downloadWordFile } from '@/lib/convertPdfToWord';
import { convertPdfToText, downloadTextFile } from '@/lib/convertPdfToText';
import { convertPdfToPowerPoint, downloadPowerPointFile } from '@/lib/convertPdfToPowerPoint';

interface PDFEditorNPMProps {
  pdfUrl: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export type PanelType = 'none' | 'properties' | 'comments' | 'thumbnails';

/** Inner component to access hooks inside EmbedPDF context */
const PDFEditorContent = ({
  leftPanel,
  rightPanel,
  setLeftPanel,
  setRightPanel,
  pluginsReady,
  isMobile
}: {
  leftPanel: PanelType;
  rightPanel: PanelType;
  setLeftPanel: (p: PanelType) => void;
  setRightPanel: (p: PanelType) => void;
  pluginsReady: boolean;
  isMobile: boolean;
}) => {
  const { state: annotationState, provides: annotationProvides } = useAnnotation();
  const { provides: exportProvides } = useExportCapability();

  // Função de exportação unificada
  const handleExport = useCallback(async (format: string, filename: string) => {
    console.log('🚀 handleExport chamado:', { format, filename });
    
    if (!exportProvides) {
      toast.error('Exportação não disponível');
      throw new Error('Export provider não disponível');
    }

    try {
      if (format === 'pdf') {
        // Exportação PDF usando EmbedPDF (funcionalidade original)
        console.log('📄 Exportando PDF...');
        exportProvides.download();
        toast.success('PDF exportado com sucesso!');
      } else if (format === 'png' || format === 'jpg') {
        console.log(`🖼️ Iniciando conversão para ${format.toUpperCase()}...`);
        // Exportação de imagens usando PDF.js no frontend
        toast.info('Preparando conversão...', {
          description: 'Gerando PDF com todas as anotações'
        });

        // IMPORTANTE: Obter o PDF completo e editado do EmbedPDF
        // saveAsCopy() retorna um ArrayBuffer com todas as anotações aplicadas
        const task = exportProvides.saveAsCopy();
        const arrayBuffer = await task.toPromise();
        
        // Converter ArrayBuffer para Blob
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });

        toast.info('Convertendo para imagem...', {
          description: 'Renderizando todas as páginas',
          duration: 10000,
        });

        // Converter usando backend
        const result = await convertPdfToImages({
          pdfBlob,
          format: format as 'png' | 'jpg',
          filename,
          quality: format === 'jpg' ? 0.92 : undefined,
          scale: 2, // Escala para boa qualidade
          onProgress: (current, total) => {
            console.log(`Processando ${current}/${total} páginas`);
          },
        });

        if (result.success) {
          toast.success(`${result.totalPages} página(s) convertida(s)!`, {
            description: 'Iniciando downloads...'
          });

          // Baixar todas as imagens
          downloadAllImages(result.images, filename, format as 'png' | 'jpg');
          
          toast.success('Download concluído!', {
            description: `${result.totalPages} arquivo(s) baixado(s)`
          });
        } else {
          throw new Error(result.error || 'Erro na conversão');
        }
      } else if (format === 'docx') {
        console.log('📝 Iniciando conversão para Word...');
        // Exportação para Word usando Supabase Edge Function
        toast.info('Preparando conversão...', {
          description: 'Gerando documento Word estrutural'
        });

        // Obter o PDF completo e editado do EmbedPDF
        const task = exportProvides.saveAsCopy();
        const arrayBuffer = await task.toPromise();
        
        // Converter ArrayBuffer para Blob
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });

        toast.info('Convertendo para Word...', {
          description: 'Processando documento no servidor',
          duration: 15000,
        });

        // Converter usando backend (Supabase Edge Function)
        const result = await convertPdfToWord({
          pdfBlob,
          filename,
        });

        if (result.success && result.data) {
          toast.success('Conversão concluída!', {
            description: 'Iniciando download...'
          });

          // Baixar arquivo Word
          downloadWordFile(result.data, filename);
          
          toast.success('Download concluído!', {
            description: `Arquivo ${filename}.docx baixado`
          });
        } else {
          throw new Error(result.error || 'Erro na conversão para Word');
        }
      } else if (format === 'txt') {
        console.log('📝 Iniciando extração de texto com OCR...');
        // Extração de texto usando Tesseract OCR
        toast.info('Preparando extração...', {
          description: 'Analisando documento'
        });

        // Obter o PDF completo e editado do EmbedPDF
        const task = exportProvides.saveAsCopy();
        const arrayBuffer = await task.toPromise();
        
        // Converter ArrayBuffer para Blob
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });

        toast.info('Extraindo texto com OCR...', {
          description: 'Processando todas as páginas',
          duration: 30000,
        });

        // Extrair texto usando backend (Supabase Edge Function + Tesseract)
        const result = await convertPdfToText({
          pdfBlob,
          filename,
          language: 'por+eng', // Português + Inglês
        });

        if (result.success && result.text) {
          toast.success('Extração concluída!', {
            description: `${result.pages} página(s), ${result.characters} caracteres`
          });

          // Baixar arquivo de texto
          downloadTextFile(result.text, filename);
          
          toast.success('Download concluído!', {
            description: `Arquivo ${filename}.txt baixado`
          });
        } else {
          throw new Error(result.error || 'Erro na extração de texto');
        }
      } else if (format === 'pptx') {
        console.log('📊 Iniciando conversão para PowerPoint...');
        toast.info('Preparando conversão...', {
          description: 'Gerando apresentação PowerPoint'
        });
        
        const task = exportProvides.saveAsCopy();
        const arrayBuffer = await task.toPromise();
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        
        toast.info('Convertendo para PowerPoint...', {
          description: 'Processando documento no servidor',
          duration: 20000,
        });
        
        const result = await convertPdfToPowerPoint({
          pdfBlob,
          filename,
        });
        
        if (result.success && result.data) {
          toast.success('Conversão concluída!', {
            description: 'Iniciando download...'
          });
          downloadPowerPointFile(result.data, filename);
          toast.success('Download concluído!', {
            description: `Arquivo ${filename}.pptx baixado`
          });
        } else {
          throw new Error(result.error || 'Erro na conversão para PowerPoint');
        }
      } else {
        toast.info('Em breve!', {
          description: `A exportação para ${format} estará disponível em breve.`
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar', {
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado'
      });
      throw error;
    }
  }, [exportProvides]);

  // Definir defaults FIXOS para FreeText quando o plugin estiver pronto
  useEffect(() => {
    if (!pluginsReady || !annotationProvides) return;

    console.log('⚙️ Configurando defaults FIXOS para FreeText');
    
    // Defaults fixos: vermelho (#ff0000), tamanho 12
    annotationProvides.setToolDefaults('freeText', {
      fontColor: '#ff0000',  // Vermelho
      fontSize: 12,          // Tamanho 12
      opacity: 1,            // Opacidade total
    });
    
    console.log('✅ FreeText configurado: vermelho, tamanho 12');
  }, [pluginsReady, annotationProvides]);

  // Auto-open properties panel when a tool with configurable properties is selected
  // FreeText NÃO abre o painel pois usará defaults fixos
  useEffect(() => {
    const toolsWithProperties = ['ink', 'highlight', 'underline', 'strikeout', 'squiggly', 'square', 'circle', 'lineArrow', 'stamp'];
    
    if (annotationState?.activeToolId && toolsWithProperties.includes(annotationState.activeToolId)) {
      // open left panel (properties) automatically
      setLeftPanel('properties');
    }
  }, [annotationState?.activeToolId, setLeftPanel]);

  // Generic togglers for left/right panels
  const toggleLeftPanel = useCallback((panel: PanelType) => {
    const newPanel = leftPanel === panel ? 'none' : panel;
    setLeftPanel(newPanel);
    
    // On mobile, close right panel when opening left panel
    if (isMobile && newPanel !== 'none' && rightPanel !== 'none') {
      setRightPanel('none');
    }
  }, [leftPanel, setLeftPanel, rightPanel, setRightPanel, isMobile]);

  const toggleRightPanel = useCallback((panel: PanelType) => {
    const newPanel = rightPanel === panel ? 'none' : panel;
    setRightPanel(newPanel);
    
    // On mobile, close left panel when opening right panel
    if (isMobile && newPanel !== 'none' && leftPanel !== 'none') {
      setLeftPanel('none');
    }
  }, [rightPanel, setRightPanel, leftPanel, setLeftPanel, isMobile]);

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      {/* Toolbar receives both toggles (left/right) */}
      <EditorToolbar 
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        onToggleLeft={(panel) => toggleLeftPanel(panel)}
        onToggleRight={(panel) => toggleRightPanel(panel)}
      />
      
      {/* Main Content Area: left sidebar | viewer | right sidebar (desktop only) */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar - Desktop only */}
        {!isMobile && leftPanel === 'properties' && (
          <div className="flex-shrink-0">
            <PropertiesPanel onClose={() => setLeftPanel('none')} anchor="left" />
          </div>
        )}
        
        {!isMobile && leftPanel === 'thumbnails' && (
          <div className="flex-shrink-0">
            <ThumbnailsSidebar onClose={() => setLeftPanel('none')} anchor="left" />
          </div>
        )}

        {/* PDF Viewport (center) */}
        <div className="flex-1 relative min-w-0">
          {!pluginsReady ? (
            <div className="flex-1 flex items-center justify-center bg-muted/30">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-[300px] h-[400px] rounded-lg" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Carregando documento.
                </p>
              </div>
            </div>
          ) : (
            <GlobalPointerProvider>
              <div className="h-full w-full">
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
                          className="shadow-lg bg-white mx-auto"
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
              </div>
            </GlobalPointerProvider>
          )}
        </div>

        {/* Right Sidebar (Comments) - Desktop only */}
        {!isMobile && rightPanel === 'comments' && (
          <div className="flex-shrink-0">
            <CommentsPanel onClose={() => setRightPanel('none')} anchor="right" />
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet for Properties */}
      {isMobile && (
        <Drawer open={leftPanel === 'properties'} onOpenChange={(open) => {
          if (!open) setLeftPanel('none');
        }}>
          <DrawerContent className="max-h-[90vh] p-0">
            <PropertiesPanel onClose={() => setLeftPanel('none')} anchor="left" isMobile={true} />
          </DrawerContent>
        </Drawer>
      )}

      {/* Mobile Bottom Sheet for Thumbnails */}
      {isMobile && (
        <Drawer open={leftPanel === 'thumbnails'} onOpenChange={(open) => {
          if (!open) setLeftPanel('none');
        }}>
          <DrawerContent className="max-h-[90vh] p-0">
            <ThumbnailsSidebar onClose={() => setLeftPanel('none')} anchor="left" isMobile={true} />
          </DrawerContent>
        </Drawer>
      )}

      {/* Mobile Bottom Sheet for Comments */}
      {isMobile && (
        <Drawer open={rightPanel === 'comments'} onOpenChange={(open) => {
          if (!open) setRightPanel('none');
        }}>
          <DrawerContent className="max-h-[90vh] p-0">
            <CommentsPanel onClose={() => setRightPanel('none')} anchor="right" isMobile={true} />
          </DrawerContent>
        </Drawer>
      )}

      {/* Export Modal - Available for both desktop and mobile */}
      <ExportModal onExport={handleExport} />
    </div>
  );
};

export const PDFEditorNPM = ({ 
  pdfUrl, 
  onLoad, 
  onError 
}: PDFEditorNPMProps) => {
  const { engine, isLoading: engineLoading, error: engineError } = usePdfiumEngine();
  const isMobile = useIsMobile();
  const [leftPanel, setLeftPanel] = useState<PanelType>('none');   // NEW
  const [rightPanel, setRightPanel] = useState<PanelType>('none'); // NEW

  // Determine zoom level based on device type
  const defaultZoomLevel = isMobile ? ZoomMode.FitWidth : 0.77;

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
      defaultZoomLevel: defaultZoomLevel,
      minZoom: 0.25,
      maxZoom: 4,
    }),
    createPluginRegistration(ThumbnailPluginPackage),
    createPluginRegistration(InteractionManagerPluginPackage),
    createPluginRegistration(PanPluginPackage),
    createPluginRegistration(SelectionPluginPackage),
    createPluginRegistration(HistoryPluginPackage),
    createPluginRegistration(AnnotationPluginPackage, {
      autoCommit: true,
      deactivateToolAfterCreate: false,
      selectAfterCreate: true,
    }),
    createPluginRegistration(RedactionPluginPackage, {
      drawBlackBoxes: true,
    }),
    createPluginRegistration(ExportPluginPackage),
  ], [pdfUrl, defaultZoomLevel]);

  const handleInitialized = useCallback(async () => {
    console.log('EmbedPDF initialized with plugins');
    onLoad?.();
  }, [onLoad]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Engine error / loading (existing logic kept)
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
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          setLeftPanel={setLeftPanel}
          setRightPanel={setRightPanel}
          pluginsReady={pluginsReady}
          isMobile={isMobile}
        />
      )}
    </EmbedPDF>
  );
};
