import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, Upload } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { toast } from 'sonner';

interface ImageToolPanelProps {
  onImageSelect: (file: File) => void;
}

export const ImageToolPanel = ({ onImageSelect }: ImageToolPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setShowToolPanel } = useEditorStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 10MB.');
      return;
    }

    onImageSelect(file);
    setShowToolPanel(false);
    toast.success('Imagem inserida! Mova e redimensione como desejar.');
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Button */}
      <Button
        variant="outline"
        className="w-full h-32 flex-col gap-3 border-dashed border-2"
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ImagePlus className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium">Selecionar Imagem</p>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP</p>
        </div>
      </Button>

      {/* Drag hint */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Após inserir, você pode mover, redimensionar e rotacionar a imagem
        </p>
      </div>
    </div>
  );
};
