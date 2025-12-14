import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConversionStep {
  label: string;
  completed: boolean;
  current: boolean;
}

interface ConversionLoadingModalProps {
  open: boolean;
  steps: ConversionStep[];
  progress: number;
}

export const ConversionLoadingModal = ({ 
  open, 
  steps, 
  progress 
}: ConversionLoadingModalProps) => {
  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing
      >
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Illustration */}
          <div className="relative w-full max-w-xs">
            <div className="flex items-center justify-between">
              {/* Blue Folder (Source) */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="w-24 h-20 bg-blue-500 rounded-lg shadow-lg" />
                <div className="absolute -top-2 left-0 w-12 h-3 bg-blue-600 rounded-t-lg" />
                
                {/* Floating file icons */}
                <motion.div
                  animate={{
                    x: [0, 50, 100],
                    y: [0, -10, 0],
                    opacity: [1, 0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-2 left-8"
                >
                  <div className="w-8 h-10 bg-red-500 rounded shadow-md flex items-center justify-center text-white text-xs font-bold">
                    PDF
                  </div>
                </motion.div>
              </motion.div>

              {/* Dotted Line */}
              <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-300" />

              {/* Green Folder (Target) */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="relative"
              >
                <div className="w-24 h-20 bg-green-500 rounded-lg shadow-lg" />
                <div className="absolute -top-2 left-0 w-12 h-3 bg-green-600 rounded-t-lg" />
              </motion.div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
              Conversão completa
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </h3>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-teal-500 to-teal-600"
              />
            </div>
            <p className="text-center text-sm text-gray-600 font-medium">
              {progress}%
            </p>
          </div>

          {/* Steps */}
          <div className="w-full space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-3"
              >
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                ) : step.current ? (
                  <Loader2 className="w-5 h-5 text-teal-500 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm ${
                  step.completed || step.current 
                    ? 'text-gray-900 font-medium' 
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
