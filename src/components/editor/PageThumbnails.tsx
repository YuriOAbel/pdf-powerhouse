import { motion } from 'framer-motion';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PageThumbnailsProps {
  thumbnails: string[];
}

export const PageThumbnails = ({ thumbnails }: PageThumbnailsProps) => {
  const { currentPage, setCurrentPage, totalPages, isLoading } = useEditorStore();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-muted/50 border-r border-border h-full overflow-y-auto w-[140px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-[3/4] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-3 p-4 bg-muted/50 border-r border-border h-full overflow-y-auto w-[140px]"
    >
      {thumbnails.map((thumbnail, index) => {
        const pageNum = index + 1;
        const isActive = pageNum === currentPage;

        return (
          <motion.button
            key={pageNum}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPage(pageNum)}
            className={cn(
              "thumbnail relative group",
              isActive && "active"
            )}
          >
            <div className="relative w-full aspect-[3/4] bg-background rounded-lg overflow-hidden">
              {thumbnail ? (
                <img 
                  src={thumbnail} 
                  alt={`Página ${pageNum}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <span className="text-muted-foreground text-sm">{pageNum}</span>
                </div>
              )}
              
              {/* Page number overlay */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 py-1 text-center text-xs font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-background/80 text-foreground group-hover:bg-primary/10"
              )}>
                {pageNum}
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
};
