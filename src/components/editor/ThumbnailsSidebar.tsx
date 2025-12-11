import { X, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScroll } from '@embedpdf/plugin-scroll/react';
import { ThumbImg } from '@embedpdf/plugin-thumbnail/react';
import { cn } from '@/lib/utils';

interface ThumbnailsSidebarProps {
  onClose: () => void;
  anchor?: 'left' | 'right';
  isMobile?: boolean;
}

export const ThumbnailsSidebar = ({ onClose, anchor = 'left', isMobile = false }: ThumbnailsSidebarProps) => {
  const { currentPage, totalPages, scrollToNextPage, scrollToPreviousPage } = useScroll();

  const sidebarClass = isMobile
    ? "w-full flex flex-col shrink-0 bg-card"
    : anchor === 'left'
    ? "w-64 border-r border-border bg-card flex flex-col shrink-0"
    : "w-64 border-l border-border bg-card flex flex-col shrink-0";

  const handleThumbnailClick = (pageNumber: number) => {
    // Navigate to page by clicking multiple times
    // This is a workaround since scrollToPage isn't available in the current API
    const diff = pageNumber - (currentPage || 1);
    if (diff > 0 && scrollToNextPage) {
      for (let i = 0; i < diff; i++) {
        setTimeout(() => scrollToNextPage(), i * 50);
      }
    } else if (diff < 0 && scrollToPreviousPage) {
      for (let i = 0; i < Math.abs(diff); i++) {
        setTimeout(() => scrollToPreviousPage(), i * 50);
      }
    }
  };

  return (
    <div className={sidebarClass} style={{ height: '100%', maxHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Miniaturas</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {totalPages}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnails Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {Array.from({ length: totalPages || 0 }, (_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === currentPage;
            const thumbMeta = { 
              pageIndex: index, 
              width: 200, 
              height: 280,
              wrapperHeight: 280,
              top: 0,
              labelHeight: 20
            };
            
            return (
              <button
                key={index}
                onClick={() => handleThumbnailClick(pageNumber)}
                className={cn(
                  "w-full p-2 rounded-lg border transition-all hover:border-primary/50 hover:bg-muted/30",
                  isActive 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-border/50 bg-background"
                )}
              >
                <div className="aspect-[8.5/11] bg-muted/30 rounded flex items-center justify-center mb-2 overflow-hidden">
                  <ThumbImg 
                    meta={thumbMeta}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-center font-medium text-foreground">
                  Página {pageNumber}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
