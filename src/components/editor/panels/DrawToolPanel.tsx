import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useEditorStore } from '@/store/editorStore';

const colors = [
  '#000000', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff',
];

export const DrawToolPanel = () => {
  const { drawSettings, setDrawSettings } = useEditorStore();

  return (
    <div className="space-y-5">
      {/* Stroke Width */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Espessura</Label>
          <span className="text-sm font-medium">{drawSettings.strokeWidth}px</span>
        </div>
        <Slider
          value={[drawSettings.strokeWidth]}
          onValueChange={([value]) => setDrawSettings({ strokeWidth: value })}
          min={1}
          max={20}
          step={1}
          className="py-2"
        />
        {/* Preview Line */}
        <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
          <div 
            className="w-full rounded-full"
            style={{ 
              height: drawSettings.strokeWidth,
              backgroundColor: drawSettings.strokeColor,
              opacity: drawSettings.opacity / 100,
            }}
          />
        </div>
      </div>

      {/* Stroke Color */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Cor</Label>
        <div className="grid grid-cols-5 gap-3">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setDrawSettings({ strokeColor: color })}
              className={`w-12 h-12 rounded-xl border-2 transition-all ${
                drawSettings.strokeColor === color 
                  ? 'border-primary scale-110 shadow-lg' 
                  : 'border-border hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Cor ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Opacidade</Label>
          <span className="text-sm font-medium">{drawSettings.opacity}%</span>
        </div>
        <Slider
          value={[drawSettings.opacity]}
          onValueChange={([value]) => setDrawSettings({ opacity: value })}
          min={10}
          max={100}
          step={5}
          className="py-2"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Desenhe diretamente no PDF
      </p>
    </div>
  );
};
