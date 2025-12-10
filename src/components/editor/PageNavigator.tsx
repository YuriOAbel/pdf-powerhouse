import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScroll } from '@embedpdf/plugin-scroll/react';

export const PageNavigator = () => {
  const { currentPage, totalPages, scrollToNextPage, scrollToPreviousPage } = useScroll();

  const handlePrevious = () => {
    scrollToPreviousPage?.();
  };

  const handleNext = () => {
    scrollToNextPage?.();
  };

  if (totalPages <= 1) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border border-border rounded-full shadow-lg px-2 py-1 flex items-center gap-1 z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-full" 
        onClick={handlePrevious} 
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-1 px-2 min-w-[60px] justify-center select-none">
        <span className="font-medium text-sm">{currentPage}</span>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-muted-foreground text-sm">{totalPages}</span>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-full" 
        onClick={handleNext} 
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
