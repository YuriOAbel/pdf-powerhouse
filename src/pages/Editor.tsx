import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fabric } from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import { ArrowLeft, Sparkles, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { PageThumbnails } from '@/components/editor/PageThumbnails';
import { PDFCanvas } from '@/components/editor/PDFCanvas';
import { ExportModal } from '@/components/editor/ExportModal';
import { ToolPanel } from '@/components/editor/ToolPanel';
import { useEditorStore } from '@/store/editorStore';
import { toast } from 'sonner';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const EditorPage = () => {
  const navigate = useNavigate();
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<'text' | 'stamp' | 'note' | null>(null);
  
  const { 
    pdfUrl, pdfFile, currentPage, setTotalPages, setIsLoading, setIsExportModalOpen, reset,
    textSettings, stampSettings, noteSettings, setActiveTool
  } = useEditorStore();

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

  const handleAddText = () => setPendingAction('text');
  const handleAddStamp = () => setPendingAction('stamp');
  const handleAddNote = () => setPendingAction('note');

  const handleImageSelect = (file: File) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.Image.fromURL(e.target?.result as string, (img) => {
        img.scaleToWidth(200);
        img.set({ left: 100, top: 100, cornerStyle: 'circle', transparentCorners: false });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        setActiveTool('select');
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = (e: { x: number; y: number }) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !pendingAction) return;

    if (pendingAction === 'text') {
      const text = new fabric.IText('Digite aqui', {
        left: e.x, top: e.y,
        fontFamily: textSettings.fontFamily,
        fontSize: textSettings.fontSize,
        fill: textSettings.fontColor,
        fontWeight: textSettings.isBold ? 'bold' : 'normal',
        fontStyle: textSettings.isItalic ? 'italic' : 'normal',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
    } else if (pendingAction === 'stamp') {
      const label = stampSettings.type === 'custom' ? stampSettings.customText : 
        { approved: 'APROVADO', reviewed: 'REVISADO', paid: 'PAGO' }[stampSettings.type];
      const text = new fabric.Text(label.toUpperCase(), {
        left: e.x, top: e.y,
        fontSize: 24, fontWeight: 'bold', fill: stampSettings.color,
        stroke: stampSettings.color, strokeWidth: 1,
      });
      const rect = new fabric.Rect({
        left: e.x - 10, top: e.y - 5,
        width: text.width! + 20, height: text.height! + 10,
        fill: 'transparent', stroke: stampSettings.color, strokeWidth: 2, rx: 4, ry: 4,
      });
      const group = new fabric.Group([rect, text], { left: e.x, top: e.y });
      canvas.add(group);
    } else if (pendingAction === 'note') {
      const noteIcon = new fabric.Rect({
        width: 30, height: 30, fill: noteSettings.color, rx: 4, ry: 4,
      });
      const noteText = new fabric.Text('📝', { fontSize: 16, left: 5, top: 3 });
      const group = new fabric.Group([noteIcon, noteText], {
        left: e.x, top: e.y, hasControls: true,
      });
      (group as any).noteContent = noteSettings.text;
      canvas.add(group);
      toast.info('Nota adicionada!', { description: noteSettings.text.slice(0, 50) });
    }
    
    canvas.renderAll();
    setPendingAction(null);
    setActiveTool('select');
  };

  const handleExport = async (format: string, filename: string) => {
    await new Promise(r => setTimeout(r, 1500));
    if (pdfUrl && format === 'pdf') {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${filename}.pdf`;
      link.click();
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
          <span className="font-semibold hidden sm:block">PDFaid</span>
        </div>
        <span className="text-sm text-muted-foreground truncate flex-1">{pdfFile?.name || 'Documento'}</span>
        <div className="flex md:hidden gap-2">
          <Button variant="outline" size="icon" onClick={() => toast.success('Salvo!')}>
            <Save className="w-4 h-4" />
          </Button>
          <Button size="icon" onClick={() => setIsExportModalOpen(true)} className="bg-gradient-hero">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </header>
      
      <EditorToolbar onUndo={() => {}} onRedo={() => {}} onSave={() => toast.success('Salvo!')} onDownload={() => setIsExportModalOpen(true)} />
      
      <ToolPanel 
        onImageSelect={handleImageSelect}
        onAddText={handleAddText}
        onAddStamp={handleAddStamp}
        onAddNote={handleAddNote}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <PageThumbnails thumbnails={thumbnails} />
        <PDFCanvas 
          pageImage={pageImages[currentPage - 1] || null} 
          fabricCanvasRef={fabricCanvasRef}
          onCanvasClick={pendingAction ? handleCanvasClick : undefined}
          pendingAction={pendingAction}
        />
      </div>
      <ExportModal onExport={handleExport} />
    </div>
  );
};

export default EditorPage;
