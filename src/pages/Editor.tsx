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
    // For now, download the original PDF
    // EmbedPDF annotation export will be handled by the viewer's built-in functionality
    await new Promise(r => setTimeout(r, 500));
    if (pdfUrl && format === 'pdf') {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${filename}.pdf`;
      link.click();
    }
  };

  const handleBack = () => {
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
