import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  CheckCircle2,
  Star,
  Shield,
  Zap,
  Layers,
  Award,
  Lock,
  ChevronDown,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '@/store/editorStore';
import { ConversionLoadingModal } from '@/components/ConversionLoadingModal';
import { convertPdfToImages, downloadAllImages } from '@/lib/convertPdfToImage';
import { convertPdfToWord, downloadWordFile } from '@/lib/convertPdfToWord';
import { convertPdfToPowerPoint, downloadPowerPointFile } from '@/lib/convertPdfToPowerPoint';
import { toast } from 'sonner';

interface ExportFormat {
  id: string;
  label: string;
  extension: string;
  icon: React.ReactNode;
  color: string;
}

// Formatos disponíveis na landing page (sem PDF, PDF Comprimido e Excel)
const formats: ExportFormat[] = [
  { id: 'png', label: 'PNG', extension: '.png', icon: <FileImage className="w-6 h-6" />, color: 'bg-purple-500' },
  { id: 'docx', label: 'Word', extension: '.docx', icon: <FileText className="w-6 h-6" />, color: 'bg-blue-500' },
  { id: 'jpg', label: 'JPG', extension: '.jpg', icon: <FileImage className="w-6 h-6" />, color: 'bg-pink-500' },
  { id: 'pptx', label: 'PowerPoint', extension: '.pptx', icon: <Presentation className="w-6 h-6" />, color: 'bg-orange-500' },
];

const PDFConverter = () => {
  const navigate = useNavigate();
  const { setPdfFile, setIsExportModalOpen } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('png');
  const [filename, setFilename] = useState('documento');
  const [progress, setProgress] = useState(0);
  const [conversionSteps, setConversionSteps] = useState([
    { label: 'Baixando', completed: false, current: false },
    { label: 'Convertendo o documento', completed: false, current: false },
    { label: 'Protegendo o documento', completed: false, current: false },
  ]);

  const handleFileUpload = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }

    setUploadedFile(file);
    setPdfFile(file);
    
    // Extrair nome do arquivo sem extensão
    const name = file.name.replace(/\.[^/.]+$/, '');
    setFilename(name);
    
    // Abrir modal de exportação
    setShowExportModal(true);
  }, [setPdfFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateStep = (stepIndex: number, completed: boolean, current: boolean) => {
    setConversionSteps(prev => prev.map((step, idx) => ({
      ...step,
      completed: idx < stepIndex ? true : (idx === stepIndex ? completed : false),
      current: idx === stepIndex ? current : false,
    })));
  };

  const handleExport = async () => {
    if (!uploadedFile) return;
    
    try {
      // Fechar modal de seleção e abrir loading
      setShowExportModal(false);
      setShowLoadingModal(true);
      
      // Reset progress and steps
      setProgress(0);
      setConversionSteps([
        { label: 'Baixando', completed: false, current: true },
        { label: 'Convertendo o documento', completed: false, current: false },
        { label: 'Protegendo o documento', completed: false, current: false },
      ]);

      // Step 1: Baixando (simular download)
      updateStep(0, false, true);
      setProgress(10);
      
      // Para formatos leves (PNG/JPG), adicionar delay de 3s
      const isLightFormat = selectedFormat === 'png' || selectedFormat === 'jpg';
      if (isLightFormat) {
        await sleep(1000);
        setProgress(33);
      }

      // Step 2: Convertendo
      updateStep(1, false, true);
      setProgress(40);

      const pdfBlob = uploadedFile;
      let conversionSuccess = false;

      if (selectedFormat === 'png' || selectedFormat === 'jpg') {
        // Conversão para imagem
        if (isLightFormat) {
          await sleep(1000);
          setProgress(60);
        }

        const result = await convertPdfToImages({
          pdfBlob,
          format: selectedFormat as 'png' | 'jpg',
          filename,
          quality: selectedFormat === 'jpg' ? 0.92 : undefined,
          scale: 2,
        });

        if (result.success) {
          setProgress(80);
          
          // Step 3: Protegendo/Finalizando
          updateStep(2, false, true);
          
          if (isLightFormat) {
            await sleep(1000);
          }
          
          setProgress(100);
          updateStep(2, true, false);
          
          // Pequeno delay para mostrar 100%
          await sleep(500);
          
          // Download
          await downloadAllImages(result.images, filename, selectedFormat as 'png' | 'jpg');
          conversionSuccess = true;
        }
      } else if (selectedFormat === 'docx') {
        // Conversão para Word
        const result = await convertPdfToWord({
          pdfBlob,
          filename,
        });

        if (result.success && result.data) {
          setProgress(80);
          
          // Step 3: Protegendo/Finalizando
          updateStep(2, false, true);
          await sleep(500);
          
          setProgress(100);
          updateStep(2, true, false);
          await sleep(500);
          
          downloadWordFile(result.data, filename);
          conversionSuccess = true;
        }
      } else if (selectedFormat === 'pptx') {
        // Conversão para PowerPoint
        const result = await convertPdfToPowerPoint({
          pdfBlob,
          filename,
        });

        if (result.success && result.data) {
          setProgress(80);
          
          // Step 3: Protegendo/Finalizando
          updateStep(2, false, true);
          await sleep(500);
          
          setProgress(100);
          updateStep(2, true, false);
          await sleep(500);
          
          downloadPowerPointFile(result.data, filename);
          conversionSuccess = true;
        }
      }

      if (conversionSuccess) {
        // Fechar modal de loading após sucesso
        await sleep(1000);
        setShowLoadingModal(false);
        toast.success('Conversão concluída!', {
          description: `Arquivo ${filename} convertido com sucesso`
        });
      } else {
        throw new Error('Erro na conversão');
      }
      
    } catch (error) {
      console.error('Erro na conversão:', error);
      setShowLoadingModal(false);
      toast.error('Erro na conversão', {
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Conversor de PDF
          </h1>
          
          <p className="text-xl text-gray-600 mb-4">
            775.000 conversões perfeitas do formato A para B
          </p>

          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 mb-8 transition-all ${
              isDragging
                ? 'border-primary bg-primary/5 scale-105'
                : 'border-gray-300 hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-hero">
                <Upload className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <p className="text-lg font-medium mb-2">
                  Solte seus arquivos aqui
                </p>
                <p className="text-sm text-gray-500">
                  Tamanho de até 100 MB
                </p>
              </div>
              
              <Button size="lg" className="bg-gradient-hero">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar arquivo
              </Button>
            </div>
          </div>

          {/* Trustpilot */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span>Ótimo</span>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Ao carregar o arquivo, você concorda com nossos Termos de uso e reconhece nossa Política de privacidade
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como converter arquivos para PDF e de PDF
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-hero flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">1. Upload</h3>
              <p className="text-sm text-gray-600">
                Faça o upload do arquivo para adicioná-lo na nossa plataforma.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-hero flex items-center justify-center">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">2. Escolha o formato</h3>
              <p className="text-sm text-gray-600">
                Se for um arquivo PDF, escolha um formato de saída: Word, PNG, JPG, Excel ou PPT.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-hero flex items-center justify-center">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">3. Download</h3>
              <p className="text-sm text-gray-600">
                Para outros tipos de arquivo, a ferramenta detectará automaticamente e converter para PDF.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Confiável e certificado pelos líderes do setor
          </h2>
          <div className="flex justify-center">
            <img 
              src="https://pdfguru.com/static/trusted-leaders.png" 
              alt="Certificações de segurança"
              className="max-w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Por que escolher nosso conversor de PDF
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-hero mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Conversão acelerada</h3>
                  <p className="text-sm text-gray-600">
                    Pode converter em PDF ou vice-versa em segundos, sem instalar nenhum software, para qualquer arquivo. Não perca o seu precioso tempo com tarefas maçantes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-hero mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Suporta outros arquivos</h3>
                  <p className="text-sm text-gray-600">
                    Troque facilmente entre diferentes formatos de arquivo como Word, Excel e JPG. O nosso conversor de PDF online suporta até arquivos antigos como DjVu.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-hero mb-4">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Interface amigável</h3>
                  <p className="text-sm text-gray-600">
                    Graças ao design simples e intuitivo do PDF Powerhouse, qualquer um consegue mudar para PDF ou vários outros arquivos online — sem nenhum conhecimento técnico.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-hero mb-4">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">50+ ferramentas de PDF</h3>
                  <p className="text-sm text-gray-600">
                    Terminou de converter em PDF? Agora você pode experimentar editar, unir ou comprimir na mesma ferramenta online para uma gestão completa de documentos.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-hero mb-4">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Mantém a qualidade</h3>
                  <p className="text-sm text-gray-600">
                    A nossa ferramenta para passar para PDF, PPT, JPG, etc. garante que os seus arquivos mantenham a sua qualidade original, incluindo textos e imagens.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-hero mb-4">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Ferramenta online segura</h3>
                  <p className="text-sm text-gray-600">
                    Os seus dados são totalmente protegidos por criptografia HTTPS, e SSL, garantindo privacidade ao adicionar arquivos ou converter em PDF online.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8">
            Transformar em PDF com uma ferramenta fácil de usar
          </h2>
          <div className="prose prose-lg mx-auto text-gray-600">
            <p>
              O PDF converter é uma ferramenta inovadora que permite converter para e de PDF, suportando formatos versáteis de entrada e saída. Mesmo arquivos grandes são convertidos para PDF em segundos no nosso sistema. Além disso, nossa ferramenta garante 100% de precisão nas conversões. Aproveite nossos algoritmos automatizados, que asseguram alta qualidade e segurança. Estamos constantemente expandindo os recursos do nosso conversor de PDF.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perguntas frequentes
          </h2>
          
          <div className="space-y-4">
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-left">Por que converter arquivo para PDF?</h3>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border-t">
                <p className="text-gray-600">
                  Porque ao utilizar o conversor PDF para modificar o seu arquivo para o formato PDF terá vários benefícios que alguns dos outros formatos não oferecem. Como a capacidade de proteger um arquivo contra modificações, cópias e outros. Além de manter o layout idêntico, facilitando a impressão, bem como, passar uma aparência mais profissional, demonstrando o seu domínio da tecnologia.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-left">Como transformar arquivo em PDF?</h3>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border-t">
                <p className="text-gray-600 mb-4">
                  Se precisa transformar documento em PDF é só seguir esses passos:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Suba para o topo desta página.</li>
                  <li>Clique no botão + ou arraste e solte o documento que deseja converter para a área de upload.</li>
                  <li>Aguarde alguns segundos para a ferramenta converter em PDF finalizar.</li>
                  <li>Terminando, a ferramenta vai salvar em PDF o arquivo convertido no seu dispositivo.</li>
                </ol>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-left">Como converter arquivos PDF para outros formatos?</h3>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border-t">
                <p className="text-gray-600 mb-4">
                  A nossa ferramenta também converte PDF para diferentes tipos de arquivo, para isso:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Acione o arquivo na janela e selecione um desses tipos: Word (DOCX), PNG, JPG, Excel (XLSX) e PowerPoint (PPTX).</li>
                  <li>Aguarde alguns segundos para converter o seu arquivo.</li>
                  <li>Encontre o arquivo convertido baixado no seu dispositivo.</li>
                </ol>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-left">Como converter arquivos para PDF no Mac?</h3>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border-t">
                <p className="text-gray-600">
                  O Mac possui um aplicativo integrado chamado Pré-Visualização, com ele é possível trabalhar com PDFs. Todavia, ele só pode converter um número limitado de formatos, como JPG e PNG imagens e alguns outros. Assim, se precisa trabalhar com conversões de arquivos como Excel e outros, não encontrará no Pré-Visualização essa opção. Por isso, sugerimos utilizar o PDF Powerhouse, uma ferramenta online de conversão completa.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-left">Os conversores de PDF online são seguros para uso?</h3>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border-t">
                <p className="text-gray-600">
                  Sim, os prestadores de serviços cumprem a lei e seguem todas as condições para um uso seguro. Todos os dados do utilizador são criptografados usando sistemas modernos e avançados de criptografia. Você pode ler mais sobre as medidas de segurança nos nossos Termos e Condições.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </section>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-xl bg-gradient-hero">
                <Download className="w-5 h-5 text-primary-foreground" />
              </div>
              Ótimo trabalho!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <p className="text-muted-foreground text-center">
              Selecione o formato para baixar seu arquivo.
            </p>

            {/* Filename */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do arquivo</label>
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Nome do arquivo"
              />
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Escolha o formato</label>
              <div className="grid grid-cols-2 gap-3">
                {formats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      selectedFormat === format.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${format.color} text-white`}>
                      {format.icon}
                    </div>
                    <span className="text-sm font-medium">{format.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleExport}
              className="w-full bg-gradient-hero"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar arquivo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversion Loading Modal */}
      <ConversionLoadingModal
        open={showLoadingModal}
        steps={conversionSteps}
        progress={progress}
      />
    </div>
  );
};

export default PDFConverter;
