import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Edit, FileOutput, Sparkles, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/upload/FileUpload';
import { useEditorStore } from '@/store/editorStore';
import { toast } from 'sonner';
import heroBg from '@/assets/hero-bg.png';

const features = [
  {
    icon: <Edit className="w-5 h-5" />,
    title: 'Edição Visual',
    description: 'Adicione texto, desenhos, marcações e assinaturas'
  },
  {
    icon: <FileOutput className="w-5 h-5" />,
    title: 'Múltiplos Formatos',
    description: 'Converta para DOCX, PPTX, PNG, JPG e mais'
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Rápido e Fácil',
    description: 'Sem instalação, direto no navegador'
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Seguro',
    description: 'Seus arquivos são processados com segurança'
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { setPdfFile, setPdfUrl, setIsLoading } = useEditorStore();

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    
    try {
      // Create object URL for the PDF
      const url = URL.createObjectURL(file);
      setPdfFile(file);
      setPdfUrl(url);
      
      toast.success('Arquivo carregado!', {
        description: 'Redirecionando para o editor...'
      });
      
      setTimeout(() => {
        navigate('/editor');
      }, 500);
    } catch (error) {
      toast.error('Erro ao carregar arquivo', {
        description: 'Por favor, tente novamente.'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="p-2 rounded-xl bg-gradient-hero">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">PDFaid</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button variant="ghost" size="sm">
              Sobre
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${heroBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Gratuito • Sem cadastro</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-tight"
            >
              Edite e converta seus
              <span className="text-gradient block">PDFs online</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Ferramenta poderosa e gratuita para editar, anotar e converter seus documentos PDF em diversos formatos.
            </motion.p>

            {/* Upload Area */}
            <div className="pt-8">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-muted-foreground text-lg">
              Ferramentas completas para trabalhar com seus PDFs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-accent text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 PDFaid. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
