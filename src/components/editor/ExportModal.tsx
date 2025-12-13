import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  Presentation,
  FileType,
  Download,
  X,
  Loader2,
  FileArchive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportFormat {
  id: string;
  label: string;
  extension: string;
  icon: React.ReactNode;
  color: string;
}

const formats: ExportFormat[] = [
  { id: 'pdf', label: 'PDF', extension: '.pdf', icon: <FileText className="w-6 h-6" />, color: 'bg-red-500' },
  { id: 'compress', label: 'PDF Comprimido', extension: '.pdf', icon: <FileArchive className="w-6 h-6" />, color: 'bg-indigo-500' },
  { id: 'png', label: 'PNG', extension: '.png', icon: <FileImage className="w-6 h-6" />, color: 'bg-purple-500' },
  { id: 'docx', label: 'Word', extension: '.docx', icon: <FileText className="w-6 h-6" />, color: 'bg-blue-500' },
  { id: 'xlsx', label: 'Excel', extension: '.xlsx', icon: <FileSpreadsheet className="w-6 h-6" />, color: 'bg-green-500' },
  { id: 'jpg', label: 'JPG', extension: '.jpg', icon: <FileImage className="w-6 h-6" />, color: 'bg-pink-500' },
  { id: 'pptx', label: 'PowerPoint', extension: '.pptx', icon: <Presentation className="w-6 h-6" />, color: 'bg-orange-500' },
];

interface ExportModalProps {
  onExport: (format: string, filename: string) => Promise<void>;
}

export const ExportModal = ({ onExport }: ExportModalProps) => {
  const { isExportModalOpen, setIsExportModalOpen, pdfFile, isProcessing, setIsProcessing } = useEditorStore();
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [filename, setFilename] = useState(() => {
    const name = pdfFile?.name || 'documento';
    return name.replace(/\.[^/.]+$/, '');
  });

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      await onExport(selectedFormat, filename);
      setIsExportModalOpen(false);
    } catch (error) {
      // O erro já é tratado no handleExport do PDFEditorNPM
      console.error('Export error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-xl bg-gradient-hero">
              <Download className="w-5 h-5 text-primary-foreground" />
            </div>
            Ótimo trabalho!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-muted-foreground text-center">
            Selecione o formato para baixar seu arquivo.
          </p>

          {/* Filename input */}
          <div className="space-y-2">
            <Label htmlFor="filename">Nome do arquivo</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Digite o nome do arquivo"
            />
          </div>

          {/* Format selection */}
          <div className="space-y-3">
            <Label>Escolha o formato</Label>
            <div className="grid grid-cols-4 gap-3">
              {formats.map((format) => (
                <motion.button
                  key={format.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFormat(format.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                    selectedFormat === format.id
                      ? "border-primary bg-accent shadow-glow"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                >
                  <div className={cn("p-2 rounded-lg text-white", format.color)}>
                    {format.icon}
                  </div>
                  <span className="text-sm font-medium">{format.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Download button */}
          <Button 
            onClick={handleExport} 
            disabled={isProcessing || !filename}
            className="w-full h-12 text-lg gap-2 bg-gradient-hero hover:opacity-90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Baixar arquivo
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
