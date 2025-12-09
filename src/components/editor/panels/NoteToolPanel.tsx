import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, StickyNote } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

const noteColors = [
  { color: '#fbbf24', label: 'Amarelo' },
  { color: '#fb923c', label: 'Laranja' },
  { color: '#f87171', label: 'Vermelho' },
  { color: '#a78bfa', label: 'Roxo' },
  { color: '#60a5fa', label: 'Azul' },
  { color: '#34d399', label: 'Verde' },
];

interface NoteToolPanelProps {
  onConfirm: () => void;
}

export const NoteToolPanel = ({ onConfirm }: NoteToolPanelProps) => {
  const { noteSettings, setNoteSettings, setShowToolPanel } = useEditorStore();

  const handleConfirm = () => {
    if (!noteSettings.text.trim()) return;
    onConfirm();
    setShowToolPanel(false);
  };

  return (
    <div className="space-y-4">
      {/* Note Color */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Cor da nota</Label>
        <div className="grid grid-cols-6 gap-2">
          {noteColors.map(({ color }) => (
            <button
              key={color}
              onClick={() => setNoteSettings({ color })}
              className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center ${
                noteSettings.color === color 
                  ? 'border-primary scale-110 shadow-lg' 
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Cor ${color}`}
            >
              <StickyNote className="h-4 w-4 text-white/80" />
            </button>
          ))}
        </div>
      </div>

      {/* Note Text */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Texto da nota</Label>
        <Textarea
          value={noteSettings.text}
          onChange={(e) => setNoteSettings({ text: e.target.value })}
          placeholder="Digite sua nota aqui..."
          className="min-h-[120px] resize-none"
        />
      </div>

      {/* Preview */}
      {noteSettings.text && (
        <div 
          className="p-3 rounded-lg shadow-md"
          style={{ backgroundColor: noteSettings.color }}
        >
          <p className="text-sm text-white font-medium line-clamp-3">
            {noteSettings.text}
          </p>
        </div>
      )}

      <Button 
        onClick={handleConfirm} 
        className="w-full h-12 gap-2"
        disabled={!noteSettings.text.trim()}
      >
        <Check className="h-5 w-5" />
        Toque no PDF para inserir
      </Button>
    </div>
  );
};
