import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExportCapability } from '@embedpdf/plugin-export/react';
import { toast } from 'sonner';

interface ExportButtonProps {
  filename?: string;
  className?: string;
}

export const ExportButton = ({ filename = 'documento', className }: ExportButtonProps) => {
  const { provides: exportProvider, isLoading } = useExportCapability();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!exportProvider) {
      toast.error('Exportação não disponível');
      return;
    }

    setIsExporting(true);
    
    try {
      // Use the download method from the export capability
      exportProvider.download();
      toast.success('Download do PDF iniciado!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAsCopy = async () => {
    if (!exportProvider) {
      toast.error('Exportação não disponível');
      return;
    }

    setIsExporting(true);
    
    try {
      // Use saveAsCopy to get the ArrayBuffer
      const task = exportProvider.saveAsCopy();
      const arrayBuffer = await task.toPromise();
      
      // Create blob and download
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      size="sm" 
      onClick={handleExport}
      disabled={isLoading || isExporting || !exportProvider}
      className={className}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline ml-2">
        {isExporting ? 'Exportando...' : 'Exportar'}
      </span>
    </Button>
  );
};
