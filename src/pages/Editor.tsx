import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFEditorNPM } from '@/components/editor/PDFEditorNPM';
import { useEditorStore } from '@/store/editorStore';
import { toast } from 'sonner';

const EditorPage = () => {
  const navigate = useNavigate();
  
  const { 
    pdfUrl, 
    pdfFile, 
    setIsLoading, 
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
        {/* Export button is now rendered inside PDFEditorNPM context */}
      </header>
      
      {/* PDF Editor with NPM Package */}
      {pdfUrl && (
        <PDFEditorNPM 
          pdfUrl={pdfUrl}
          onLoad={handlePdfLoad}
          onError={handlePdfError}
        />
      )}
    </div>
  );
};

export default EditorPage;
