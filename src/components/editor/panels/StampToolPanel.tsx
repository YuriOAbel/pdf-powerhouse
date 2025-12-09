import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, FileCheck, FileSearch, Wallet } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

const predefinedStamps = [
  { type: 'approved' as const, label: 'Aprovado', icon: FileCheck, color: '#22c55e' },
  { type: 'reviewed' as const, label: 'Revisado', icon: FileSearch, color: '#3b82f6' },
  { type: 'paid' as const, label: 'Pago', icon: Wallet, color: '#8b5cf6' },
];

const stampColors = [
  '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#8b5cf6',
];

interface StampToolPanelProps {
  onConfirm: () => void;
}

export const StampToolPanel = ({ onConfirm }: StampToolPanelProps) => {
  const { stampSettings, setStampSettings, setShowToolPanel } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');

  const handleSelectPredefined = (stamp: typeof predefinedStamps[0]) => {
    setStampSettings({ type: stamp.type, color: stamp.color });
  };

  const handleConfirm = () => {
    if (activeTab === 'custom' && !stampSettings.customText.trim()) {
      return;
    }
    onConfirm();
    setShowToolPanel(false);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'predefined' | 'custom')}>
        <TabsList className="w-full">
          <TabsTrigger value="predefined" className="flex-1">Pré-definidos</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">Customizado</TabsTrigger>
        </TabsList>

        <TabsContent value="predefined" className="space-y-4 mt-4">
          <div className="grid gap-3">
            {predefinedStamps.map((stamp) => (
              <button
                key={stamp.type}
                onClick={() => handleSelectPredefined(stamp)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  stampSettings.type === stamp.type && activeTab === 'predefined'
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stamp.color + '20' }}
                >
                  <stamp.icon className="h-5 w-5" style={{ color: stamp.color }} />
                </div>
                <span className="font-medium" style={{ color: stamp.color }}>
                  {stamp.label}
                </span>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Texto do carimbo</Label>
            <Input
              value={stampSettings.customText}
              onChange={(e) => setStampSettings({ customText: e.target.value, type: 'custom' })}
              placeholder="Digite o texto..."
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Cor</Label>
            <div className="grid grid-cols-6 gap-2">
              {stampColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setStampSettings({ color })}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    stampSettings.color === color 
                      ? 'border-primary scale-110 shadow-lg' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Cor ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          {stampSettings.customText && (
            <div className="p-4 border-2 border-dashed rounded-lg flex items-center justify-center">
              <span 
                className="text-lg font-bold uppercase tracking-wider px-4 py-2 border-2 rounded"
                style={{ 
                  color: stampSettings.color,
                  borderColor: stampSettings.color,
                }}
              >
                {stampSettings.customText}
              </span>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Button 
        onClick={handleConfirm} 
        className="w-full h-12 gap-2"
        disabled={activeTab === 'custom' && !stampSettings.customText.trim()}
      >
        <Check className="h-5 w-5" />
        Toque no PDF para inserir
      </Button>
    </div>
  );
};
