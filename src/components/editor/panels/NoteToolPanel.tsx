import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, StickyNote, MessageSquare, Flag, Star } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

const noteColors = [
  { color: '#fbbf24', label: 'Amarelo' },
  { color: '#fb923c', label: 'Laranja' },
  { color: '#f87171', label: 'Vermelho' },
  { color: '#a78bfa', label: 'Roxo' },
  { color: '#60a5fa', label: 'Azul' },
  { color: '#34d399', label: 'Verde' },
];

const noteStyles = [
  { id: 'sticky', icon: StickyNote, label: 'Post-it' },
  { id: 'comment', icon: MessageSquare, label: 'Comentário' },
  { id: 'flag', icon: Flag, label: 'Marcador' },
  { id: 'star', icon: Star, label: 'Estrela' },
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
      {/* Note Text */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Conteúdo da nota</Label>
        <Textarea
          value={noteSettings.text}
          onChange={(e) => setNoteSettings({ text: e.target.value })}
          placeholder="Digite sua nota aqui..."
          className="min-h-[80px] resize-none text-sm"
        />
      </div>

      {/* Color & Style - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cor do ícone</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {noteColors.map(({ color }) => (
              <button
                key={color}
                onClick={() => setNoteSettings({ color })}
                className={`w-9 h-9 rounded-lg border-2 transition-all flex items-center justify-center ${
                  noteSettings.color === color 
                    ? 'border-primary scale-110 shadow-md' 
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

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estilo do ícone</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {noteStyles.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setNoteSettings({ style: id as any })}
                className={`h-9 rounded-lg border-2 transition-all flex items-center justify-center gap-1 px-2 ${
                  noteSettings.style === id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      {noteSettings.text && (
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border">
          <div 
            className="p-2 rounded-lg shadow-sm flex-shrink-0"
            style={{ backgroundColor: noteSettings.color }}
          >
            {noteSettings.style === 'sticky' && <StickyNote className="h-5 w-5 text-white" />}
            {noteSettings.style === 'comment' && <MessageSquare className="h-5 w-5 text-white" />}
            {noteSettings.style === 'flag' && <Flag className="h-5 w-5 text-white" />}
            {noteSettings.style === 'star' && <Star className="h-5 w-5 text-white" />}
          </div>
          <p className="text-sm text-foreground line-clamp-2 flex-1">
            {noteSettings.text}
          </p>
        </div>
      )}

      <Button 
        onClick={handleConfirm} 
        className="w-full h-11 gap-2"
        disabled={!noteSettings.text.trim()}
      >
        <Check className="h-4 w-4" />
        Toque no PDF para inserir
      </Button>
    </div>
  );
};
