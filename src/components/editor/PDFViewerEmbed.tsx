import { useEffect, useRef, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PDFViewerEmbedProps {
  pdfUrl: string;
  documentName?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface EmbedPDFViewer {
  destroy: () => void;
}

interface EmbedPDFModule {
  init: (config: {
    type: 'container';
    target: HTMLElement;
    src: string;
  }) => EmbedPDFViewer;
}

declare global {
  interface Window {
    EmbedPDF?: EmbedPDFModule;
  }
}

// Load EmbedPDF script from CDN
const loadEmbedPDFScript = (): Promise<EmbedPDFModule> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.EmbedPDF) {
      resolve(window.EmbedPDF);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import EmbedPDF from 'https://snippet.embedpdf.com/embedpdf.js';
      window.EmbedPDF = EmbedPDF;
      window.dispatchEvent(new CustomEvent('embedpdf-loaded'));
    `;

    const handleLoad = () => {
      if (window.EmbedPDF) {
        resolve(window.EmbedPDF);
      } else {
        reject(new Error('EmbedPDF failed to initialize'));
      }
      window.removeEventListener('embedpdf-loaded', handleLoad);
    };

    window.addEventListener('embedpdf-loaded', handleLoad);

    // Timeout fallback
    setTimeout(() => {
      if (!window.EmbedPDF) {
        reject(new Error('EmbedPDF load timeout'));
      }
    }, 10000);

    document.head.appendChild(script);
  });
};

export const PDFViewerEmbed = ({ 
  pdfUrl, 
  documentName, 
  onLoad, 
  onError 
}: PDFViewerEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<EmbedPDFViewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !pdfUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      // Destroy previous viewer if exists
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }

      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const EmbedPDF = await loadEmbedPDFScript();

      if (!containerRef.current) return;

      // Initialize EmbedPDF
      viewerRef.current = EmbedPDF.init({
        type: 'container',
        target: containerRef.current,
        src: pdfUrl,
      });

      setIsLoading(false);
      onLoad?.();
    } catch (err) {
      console.error('Error loading EmbedPDF:', err);
      setError('Falha ao carregar o visualizador de PDF. Tente recarregar.');
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [pdfUrl, onLoad, onError]);

  useEffect(() => {
    initViewer();

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        viewerRef.current = null;
      }
    };
  }, [initViewer]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={initViewer}
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

  return (
    <div className="flex-1 relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-[300px] h-[400px] rounded-lg" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Carregando visualizador de PDF...
            </p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '100%' }}
        aria-label={documentName || 'PDF Viewer'}
      />
    </div>
  );
};
