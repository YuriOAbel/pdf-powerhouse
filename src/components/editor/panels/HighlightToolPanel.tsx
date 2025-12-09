import { Label } from '@/components/ui/label';
import { useEditorStore } from '@/store/editorStore';

const highlightColors = [
  { color: '#ffff00', label: 'Amarelo' },
  { color: '#00ff00', label: 'Verde' },
  { color: '#ff69b4', label: 'Rosa' },
  { color: '#00bfff', label: 'Azul' },
  { color: '#ffa500', label: 'Laranja' },
  { color: '#ff0000', label: 'Vermelho' },
];

export const HighlightToolPanel = () => {
  const { highlightColor, setHighlightColor } = useEditorStore();

  return (
    <div className="space-y-4">
      <Label className="text-sm text-muted-foreground">Cor do destaque</Label>
      <div className="grid grid-cols-3 gap-3">
        {highlightColors.map(({ color, label }) => (
          <button
            key={color}
            onClick={() => setHighlightColor(color)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
              highlightColor === color 
                ? 'border-primary shadow-lg' 
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <div 
              className="w-full h-8 rounded-lg"
              style={{ backgroundColor: color, opacity: 0.5 }}
            />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4">
        Toque e arraste sobre o texto para destacar
      </p>
    </div>
  );
};
