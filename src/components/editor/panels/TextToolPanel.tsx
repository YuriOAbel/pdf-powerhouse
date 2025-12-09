import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Check } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Font Family & Size - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fonte</Label>
          <Select
            value={textSettings.fontFamily}
            onValueChange={(value) => setTextSettings({ fontFamily: value })}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-[110]">
              {fontFamilies.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tamanho</Label>
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-background">
            <Slider
              value={[textSettings.fontSize]}
              onValueChange={([value]) => setTextSettings({ fontSize: value })}
              min={8}
              max={72}
              step={1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8 text-right">{textSettings.fontSize}</span>
          </div>
        </div>
      </div>

      {/* Style & Alignment - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estilo</Label>
          <div className="flex gap-1">
            <Toggle
              pressed={textSettings.isBold}
              onPressedChange={(pressed) => setTextSettings({ isBold: pressed })}
              aria-label="Negrito"
              className="h-10 w-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={textSettings.isItalic}
              onPressedChange={(pressed) => setTextSettings({ isItalic: pressed })}
              aria-label="Itálico"
              className="h-10 w-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={textSettings.isUnderline}
              onPressedChange={(pressed) => setTextSettings({ isUnderline: pressed })}
              aria-label="Sublinhado"
              className="h-10 w-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Underline className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Alinhamento</Label>
          <div className="flex gap-1">
            <Toggle
              pressed={textSettings.alignment === 'left'}
              onPressedChange={() => setTextSettings({ alignment: 'left' })}
              aria-label="Esquerda"
              className="h-10 w-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={textSettings.alignment === 'center'}
              onPressedChange={() => setTextSettings({ alignment: 'center' })}
              aria-label="Centro"
              className="h-10 w-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={textSettings.alignment === 'right'}
              onPressedChange={() => setTextSettings({ alignment: 'right' })}
              aria-label="Direita"
              className="h-10 w-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
      </div>

      {/* Font Color - Full Width */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Cor do Texto</Label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setTextSettings({ fontColor: color })}
              className={`w-9 h-9 rounded-lg border-2 transition-all ${
                textSettings.fontColor === color 
                  ? 'border-primary scale-110 shadow-md' 
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Cor ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-3 bg-muted/50 rounded-lg border border-border">
        <p 
          style={{ 
            fontFamily: textSettings.fontFamily,
            fontSize: Math.min(textSettings.fontSize, 24),
            color: textSettings.fontColor,
            fontWeight: textSettings.isBold ? 'bold' : 'normal',
            fontStyle: textSettings.isItalic ? 'italic' : 'normal',
            textDecoration: textSettings.isUnderline ? 'underline' : 'none',
            textAlign: textSettings.alignment,
          }}
          className="truncate"
        >
          Prévia do texto
        </p>
      </div>

      {/* Confirm Button */}
      <Button 
        onClick={handleConfirm} 
        className="w-full h-11 gap-2 bg-primary hover:bg-primary/90"
      >
        <Check className="h-4 w-4" />
        Toque no PDF para inserir
      </Button>
    </div>
  );
};
