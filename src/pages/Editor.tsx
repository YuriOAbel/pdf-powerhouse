import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { PageThumbnails } from '@/components/editor/PageThumbnails';
import { PDFCanvas } from '@/components/editor/PDFCanvas';
import { ExportModal } from '@/components/editor/ExportModal';
import { useEditorStore } from '@/store/editorStore';
import { toast } from 'sonner';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const EditorPage = () => {
  const navigate = useNavigate();
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageImages, setPageImages] = useState<string[]>([]);
  
  const { pdfUrl, pdfFile, currentPage, setTotalPages, setIsLoading, setIsExportModalOpen, reset } = useEditorStore();

  useEffect(() => {
    if (!pdfUrl) { navigate('/'); return; }

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        setTotalPages(pdf.numPages);
        const thumbs: string[] = [];
        const pages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const thumbViewport = page.getViewport({ scale: 0.2 });
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbViewport.width;
          thumbCanvas.height = thumbViewport.height;
          await page.render({ canvasContext: thumbCanvas.getContext('2d')!, viewport: thumbViewport }).promise;
          thumbs.push(thumbCanvas.toDataURL());

          const pageViewport = page.getViewport({ scale: 2 });
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = pageViewport.width;
          pageCanvas.height = pageViewport.height;
          await page.render({ canvasContext: pageCanvas.getContext('2d')!, viewport: pageViewport }).promise;
          pages.push(pageCanvas.toDataURL());
        }
        setThumbnails(thumbs);
        setPageImages(pages);
        setIsLoading(false);
        toast.success('PDF carregado!', { description: `${pdf.numPages} página(s)` });
      } catch (error) {
        toast.error('Erro ao carregar PDF');
        navigate('/');
      }
    };
    loadPdf();
  }, [pdfUrl]);

  const handleExport = async (format: string, filename: string) => {
    await new Promise(r => setTimeout(r, 1500));
    if (pdfUrl && format === 'pdf') {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${filename}.pdf`;
      link.click();
    } else {
      toast.info('Conversão requer backend');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => { reset(); navigate('/'); }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-hero">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">PDFaid</span>
        </div>
        <span className="text-sm text-muted-foreground truncate">{pdfFile?.name || 'Documento'}</span>
      </header>
      <EditorToolbar onUndo={() => {}} onRedo={() => {}} onSave={() => toast.success('Salvo!')} onDownload={() => setIsExportModalOpen(true)} />
      <div className="flex-1 flex overflow-hidden">
        <PageThumbnails thumbnails={thumbnails} />
        <PDFCanvas pageImage={pageImages[currentPage - 1] || null} fabricCanvasRef={fabricCanvasRef} />
      </div>
      <ExportModal onExport={handleExport} />
    </div>
  );
};

export default EditorPage;
