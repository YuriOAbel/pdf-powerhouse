import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFEditorSnippet } from '@/components/editor/PDFEditorSnippet';
import { ExportModal } from '@/components/editor/ExportModal';
import { useEditorStore } from '@/store/editorStore';
import { toast } from 'sonner';

const EditorPage = () => {
  const navigate = useNavigate();
  
  const { 
    pdfUrl, 
    pdfFile, 
    setIsLoading, 
    setIsExportModalOpen, 
    reset 
  } = useEditorStore();

  useEffect(() => {
    if (!pdfUrl) {
      navigate('/');
    }
  }, [pdfUrl, navigate]);

  const handlePdfLoad = useCallback(() => {
    setIsLoading(false);
    toast.success('PDF carregado!');
  }, [setIsLoading]);

  const handlePdfError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    toast.error('Erro ao carregar PDF');
  }, []);

  const handleExport = async (format: string, filename: string) => {
    if (format === 'pdf') {
      const instance = window.__EMBEDPDF_INSTANCE__;
      
      // Try native download method
      if (instance?.download) {
        console.log('Using EmbedPDF download method');
        instance.download();
        return;
      }
      
      // Try exportPDF method
      if (instance?.exportPDF) {
        try {
          console.log('Using EmbedPDF exportPDF method');
          const data = await instance.exportPDF();
          const blob = data instanceof Blob 
            ? data 
            : new Blob([data as ArrayBuffer], { type: 'application/pdf' });
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          return;
        } catch (err) {
          console.warn('exportPDF failed:', err);
        }
      }
      
      // Try getPDF method
      if (instance?.getPDF) {
        try {
          console.log('Using EmbedPDF getPDF method');
          const blob = await instance.getPDF();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          return;
        } catch (err) {
          console.warn('getPDF failed:', err);
        }
      }
      
      // Fallback: download original PDF
      console.warn('EmbedPDF export methods not available, downloading original');
      if (pdfUrl) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${filename}.pdf`;
        link.click();
      }
    }
  };

  const handleBack = () => {
    // Cleanup EmbedPDF instance
    delete window.__EMBEDPDF_INSTANCE__;
    delete window.__EMBEDPDF_URL__;
    reset();
    navigate('/');
  };

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-hero">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold hidden sm:block">PDFaid</span>
        </div>
        <span className="text-sm text-muted-foreground truncate flex-1">
          {pdfFile?.name || 'Documento'}
        </span>
        <Button 
          size="sm" 
          onClick={() => setIsExportModalOpen(true)} 
          className="bg-gradient-hero gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </header>
      
      {/* PDF Editor with Full Toolbar */}
      {pdfUrl && (
        <PDFEditorSnippet 
          pdfUrl={pdfUrl}
          onLoad={handlePdfLoad}
          onError={handlePdfError}
        />
      )}
      
      {/* Export Modal */}
      <ExportModal onExport={handleExport} />
    </div>
  );
};

export default EditorPage;
