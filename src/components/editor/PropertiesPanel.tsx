import { useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useAnnotation } from '@embedpdf/plugin-annotation/react';
import { cn } from '@/lib/utils';

interface PropertiesPanelProps {
  onClose: () => void;
  anchor?: 'left' | 'right';
  isMobile?: boolean;
}

const COLORS = [
  '#000000', '#374151', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
];

const FONTS = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times-Roman', label: 'Times New Roman' },
  { value: 'Courier', label: 'Courier' },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

export const PropertiesPanel = ({ onClose, anchor = 'right', isMobile = false }: PropertiesPanelProps) => {
  const { state, provides } = useAnnotation();
  
  const activeTool = state?.activeToolId;
  
  // Get tool defaults from the tools array
  const toolDefaults = useMemo(() => {
    if (!activeTool || !state?.tools) return null;
    const tool = state.tools.find(t => t.id === activeTool);
    return tool?.defaults || null;
  }, [activeTool, state?.tools]);

  // compute classes based on anchor
  const panelClass = isMobile
    ? "w-full flex flex-col shrink-0"
    : anchor === 'left'
    ? "w-72 border-r border-border bg-card flex flex-col shrink-0"
    : "w-72 border-l border-border bg-card flex flex-col shrink-0";

  const handleColorChange = (color: string) => {
    if (activeTool && provides) {
      provides.setToolDefaults(activeTool, { color });
    }
  };

  const handleFontChange = (fontFamily: string) => {
    if (activeTool && provides) {
      provides.setToolDefaults(activeTool, { fontFamily });
    }
  };

  const handleFontSizeChange = (fontSize: string) => {
    if (activeTool && provides) {
      provides.setToolDefaults(activeTool, { fontSize: parseInt(fontSize) });
    }
  };

  const handleStrokeWidthChange = (value: number[]) => {
    if (activeTool && provides) {
      provides.setToolDefaults(activeTool, { strokeWidth: value[0] });
    }
  };

  const handleOpacityChange = (value: number[]) => {
    if (activeTool && provides) {
      provides.setToolDefaults(activeTool, { opacity: value[0] / 100 });
    }
  };

  const currentColor = (toolDefaults as any)?.color || '#000000';
  const currentFont = (toolDefaults as any)?.fontFamily || 'Helvetica';
  const currentFontSize = (toolDefaults as any)?.fontSize || 16;
  const currentStrokeWidth = (toolDefaults as any)?.strokeWidth || 2;
  const currentOpacity = ((toolDefaults as any)?.opacity ?? 1) * 100;

  const showTextOptions = activeTool === 'freeText' || activeTool === 'note';
  const showShapeOptions = ['square', 'circle', 'lineArrow', 'ink', 'highlight', 'underline', 'strikeout', 'squiggly'].includes(activeTool || '');

  return (
    <div className={panelClass}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Propriedades</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!activeTool ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Selecione uma ferramenta para ver as opções de estilo.
          </p>
        ) : (
          <>
            {/* Color Palette */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Cor
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      "h-8 w-8 rounded-md border-2 transition-all hover:scale-110",
                      currentColor === color ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Cor ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Text Options */}
            {showTextOptions && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <Label className="text-xs font-medium uppercase text-muted-foreground">
                    Fonte
                  </Label>
                  <Select value={currentFont} onValueChange={handleFontChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium uppercase text-muted-foreground">
                    Tamanho
                  </Label>
                  <Select value={String(currentFontSize)} onValueChange={handleFontSizeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZES.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Shape Options */}
            {showShapeOptions && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase text-muted-foreground">
                      Espessura
                    </Label>
                    <span className="text-xs text-muted-foreground">{currentStrokeWidth}px</span>
                  </div>
                  <Slider
                    value={[currentStrokeWidth]}
                    onValueChange={handleStrokeWidthChange}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase text-muted-foreground">
                      Opacidade
                    </Label>
                    <span className="text-xs text-muted-foreground">{Math.round(currentOpacity)}%</span>
                  </div>
                  <Slider
                    value={[currentOpacity]}
                    onValueChange={handleOpacityChange}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
