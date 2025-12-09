import { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const FileUpload = ({ onFileSelect, isLoading }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isLoading,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300",
          "p-12 flex flex-col items-center justify-center gap-6",
          "bg-card hover:bg-accent/50",
          isDragActive 
            ? "border-primary bg-accent scale-[1.02] shadow-glow" 
            : "border-border hover:border-primary/50",
          isLoading && "pointer-events-none opacity-70"
        )}
      >
        <input {...getInputProps()} ref={inputRef} />
        
        {/* Animated background gradient */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-shimmer" />
        </div>

        {/* Icon container */}
        <motion.div
          animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={cn(
            "relative p-6 rounded-2xl transition-colors duration-300",
            isDragActive ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
          )}
        >
          <Upload className="w-10 h-10" />
          <motion.div
            animate={isDragActive ? { scale: 1.2, opacity: 1 } : { scale: 0, opacity: 0 }}
            className="absolute -top-2 -right-2 bg-success text-success-foreground rounded-full p-1"
          >
            <FileText className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Text content */}
        <div className="text-center space-y-2 relative z-10">
          <h3 className="text-xl font-semibold text-foreground">
            {isDragActive ? "Solte seu arquivo aqui" : "Arraste e solte seu PDF"}
          </h3>
          <p className="text-muted-foreground">
            ou clique para selecionar
          </p>
        </div>

        {/* Supported formats */}
        <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
          <FormatBadge icon={<FileText className="w-3.5 h-3.5" />} label="PDF" />
          <FormatBadge icon={<Image className="w-3.5 h-3.5" />} label="JPG" />
          <FormatBadge icon={<Image className="w-3.5 h-3.5" />} label="PNG" />
        </div>

        {/* Size limit */}
        <p className="text-xs text-muted-foreground relative z-10">
          Tamanho máximo: 50MB
        </p>
      </div>
    </motion.div>
  );
};

const FormatBadge = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
    {icon}
    {label}
  </span>
);
