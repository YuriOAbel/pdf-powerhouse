import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Bold, Italic, Check } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
];

const colors = [
  '#000000', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

interface TextToolPanelProps {
  onConfirm: () => void;
}

export const TextToolPanel = ({ onConfirm }: TextToolPanelProps) => {
  const { textSettings, setTextSettings, setShowToolPanel } = useEditorStore();

  const handleConfirm = () => {
    onConfirm();
    setShowToolPanel(false);
  };

  return (
    <div className="space-y-5">
      {/* Font Family */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Fonte</Label>
        <Select
          value={textSettings.fontFamily}
          onValueChange={(value) => setTextSettings({ fontFamily: value })}
        >
          <SelectTrigger className="w-full h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-[60]">
            {fontFamilies.map((font) => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Tamanho</Label>
          <span className="text-sm font-medium">{textSettings.fontSize}px</span>
        </div>
        <Slider
          value={[textSettings.fontSize]}
          onValueChange={([value]) => setTextSettings({ fontSize: value })}
          min={8}
          max={72}
          step={1}
          className="py-2"
        />
      </div>

      {/* Font Style */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Estilo</Label>
        <div className="flex gap-2">
          <Toggle
            pressed={textSettings.isBold}
            onPressedChange={(pressed) => setTextSettings({ isBold: pressed })}
            aria-label="Negrito"
            className="h-12 w-12 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Bold className="h-5 w-5" />
          </Toggle>
          <Toggle
            pressed={textSettings.isItalic}
            onPressedChange={(pressed) => setTextSettings({ isItalic: pressed })}
            aria-label="Itálico"
            className="h-12 w-12 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Italic className="h-5 w-5" />
          </Toggle>
        </div>
      </div>

      {/* Font Color */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Cor</Label>
        <div className="grid grid-cols-8 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setTextSettings({ fontColor: color })}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                textSettings.fontColor === color 
                  ? 'border-primary scale-110 shadow-lg' 
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Cor ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      <Button 
        onClick={handleConfirm} 
        className="w-full h-12 gap-2"
      >
        <Check className="h-5 w-5" />
        Toque no PDF para inserir
      </Button>
    </div>
  );
};
