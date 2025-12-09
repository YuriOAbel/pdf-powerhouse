import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PDFEditorSnippetProps {
  pdfUrl: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Declare global types for EmbedPDF instance
declare global {
  interface Window {
    __EMBEDPDF_URL__?: string;
    __EMBEDPDF_INSTANCE__?: {
      download?: () => void;
      exportPDF?: () => Promise<ArrayBuffer | Blob>;
      getPDF?: () => Promise<Blob>;
      save?: () => void;
      [key: string]: unknown;
    };
  }
}

export const PDFEditorSnippet = ({ 
  pdfUrl, 
  onLoad, 
  onError 
}: PDFEditorSnippetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  
  // Use refs for callbacks to avoid dependency issues
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  
  // Keep refs updated
  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!pdfUrl || !containerRef.current || initialized.current) return;

    let hasLoaded = false;

    const loadEmbedPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load EmbedPDF script via script tag injection
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
          import EmbedPDF from 'https://snippet.embedpdf.com/embedpdf.js';
          
          const target = document.getElementById('pdf-viewer');
          if (target && window.__EMBEDPDF_URL__) {
            window.__EMBEDPDF_INSTANCE__ = EmbedPDF.init({
              type: 'container',
              target: target,
              src: window.__EMBEDPDF_URL__,
            });
            // Log available methods for debugging
            console.log('EmbedPDF Instance created:', window.__EMBEDPDF_INSTANCE__);
            if (window.__EMBEDPDF_INSTANCE__) {
              console.log('EmbedPDF methods:', Object.keys(window.__EMBEDPDF_INSTANCE__));
            }
            window.dispatchEvent(new CustomEvent('embedpdf-loaded'));
          }
        `;

        // Set the PDF URL globally for the script to access
        (window as unknown as { __EMBEDPDF_URL__: string }).__EMBEDPDF_URL__ = pdfUrl;
        
        const handleLoaded = () => {
          if (hasLoaded) return;
          hasLoaded = true;
          initialized.current = true;
          setIsLoading(false);
          onLoadRef.current?.();
          window.removeEventListener('embedpdf-loaded', handleLoaded);
        };
        
        window.addEventListener('embedpdf-loaded', handleLoaded);
        
        // Add timeout fallback
        setTimeout(() => {
          if (!hasLoaded) {
            hasLoaded = true;
            initialized.current = true;
            setIsLoading(false);
            onLoadRef.current?.();
          }
        }, 3000);

        document.body.appendChild(script);
      } catch (err) {
        console.error('Error loading EmbedPDF:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar o editor de PDF';
        setError(errorMessage);
        setIsLoading(false);
        onErrorRef.current?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    loadEmbedPDF();
  }, [pdfUrl]);

  const handleRetry = () => {
    initialized.current = false;
    setError(null);
    setIsLoading(true);
    window.location.reload();
  };

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

  return (
    <div className="flex-1 relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-[300px] h-[400px] rounded-lg" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Carregando editor de PDF...
            </p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef}
        id="pdf-viewer"
        className="w-full h-full"
        style={{ minHeight: '100%' }}
        aria-label="PDF Editor"
      />
    </div>
  );
};
