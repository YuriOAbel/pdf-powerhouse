import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/react';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/react';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader/react';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react';
import { ZoomPluginPackage } from '@embedpdf/plugin-zoom/react';

interface PDFViewerEmbedProps {
  pdfFile: File;
  documentName?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const PDFViewerEmbed = ({ 
  pdfFile, 
  documentName, 
  onLoad, 
  onError 
}: PDFViewerEmbedProps) => {
  const { engine, isLoading: engineLoading, error: engineError } = usePdfiumEngine();
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load the PDF file into an ArrayBuffer
  useEffect(() => {
    if (!pdfFile) return;

    const loadFile = async () => {
      try {
        const buffer = await pdfFile.arrayBuffer();
        setPdfData(buffer);
        setLoadError(null);
      } catch (err) {
        console.error('Error loading PDF file:', err);
        setLoadError('Falha ao carregar o arquivo PDF.');
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    };

    loadFile();
  }, [pdfFile, onError]);

  // Create plugins with the loaded data
  const plugins = useMemo(() => {
    if (!pdfData) return null;

    return [
      createPluginRegistration(LoaderPluginPackage, {
        loadingOptions: {
          type: 'buffer' as const,
          pdfFile: {
            id: documentName || 'uploaded-pdf',
            content: pdfData,
          },
        },
      }),
      createPluginRegistration(ViewportPluginPackage),
      createPluginRegistration(ScrollPluginPackage),
      createPluginRegistration(RenderPluginPackage),
      createPluginRegistration(ZoomPluginPackage, {
        defaultZoomLevel: 1,
      }),
    ];
  }, [pdfData, documentName]);

  // Handle engine initialization complete
  useEffect(() => {
    if (engine && pdfData && !engineLoading) {
      onLoad?.();
    }
  }, [engine, pdfData, engineLoading, onLoad]);

  // Handle engine error
  useEffect(() => {
    if (engineError) {
      onError?.(engineError);
    }
  }, [engineError, onError]);

  const handleRetry = () => {
    setLoadError(null);
    if (pdfFile) {
      pdfFile.arrayBuffer().then(buffer => {
        setPdfData(buffer);
      }).catch(err => {
        setLoadError('Falha ao carregar o arquivo PDF.');
        onError?.(err instanceof Error ? err : new Error(String(err)));
      });
    }
  };

  // Error state
  if (loadError || engineError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3">
            <span>{loadError || engineError?.message || 'Erro ao carregar o PDF'}</span>
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

  // Loading state
  if (engineLoading || !engine || !pdfData || !plugins) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-[300px] h-[400px] rounded-lg" />
          <p className="text-sm text-muted-foreground animate-pulse">
            {engineLoading ? 'Inicializando motor PDF...' : 'Carregando documento...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden" aria-label={documentName || 'PDF Viewer'}>
      <EmbedPDF engine={engine} plugins={plugins}>
        <Viewport
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'hsl(var(--muted) / 0.3)',
          }}
        >
          <Scroller
            renderPage={({ width, height, pageIndex, scale }) => (
              <div 
                style={{ 
                  width, 
                  height,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  backgroundColor: 'white',
                  margin: '8px auto',
                }}
              >
                <RenderLayer pageIndex={pageIndex} scale={scale} />
              </div>
            )}
          />
        </Viewport>
      </EmbedPDF>
    </div>
  );
};
