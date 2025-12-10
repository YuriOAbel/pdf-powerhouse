import { useState, useMemo } from 'react';
import { X, Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAnnotation } from '@embedpdf/plugin-annotation/react';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';
import { cn } from '@/lib/utils';

interface CommentsPanelProps {
  onClose: () => void;
  anchor?: 'left' | 'right';
}

export const CommentsPanel = ({ onClose, anchor = 'right' }: CommentsPanelProps) => {
  const { state, provides } = useAnnotation();
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [expandedPages, setExpandedPages] = useState<Record<number, boolean>>({});

  // Get annotations grouped by page from state structure
  const annotationsByPage = useMemo(() => {
    if (!state?.pages || !state?.byUid) return {};
    
    const grouped: Record<number, TrackedAnnotation[]> = {};
    
    Object.entries(state.pages).forEach(([pageIndex, uids]) => {
      const pageNum = parseInt(pageIndex);
      grouped[pageNum] = uids.map(uid => state.byUid[uid]).filter(Boolean);
    });
    
    return grouped;
  }, [state?.pages, state?.byUid]);

  const panelClass = anchor === 'left'
    ? "w-80 border-r border-border bg-card flex flex-col shrink-0"
    : "w-80 border-l border-border bg-card flex flex-col shrink-0";

  const pageNumbers = Object.keys(annotationsByPage).map(Number).sort((a, b) => a - b);
  const totalAnnotations = Object.values(annotationsByPage).flat().length;

  const togglePage = (page: number) => {
    setExpandedPages(prev => ({
      ...prev,
      [page]: !prev[page],
    }));
  };

  const handleReply = (annotationId: string) => {
    const text = replyText[annotationId]?.trim();
    if (!text || !provides) return;
    
    // Add reply to annotation (if supported by the plugin)
    console.log('Reply to annotation:', annotationId, text);
    
    // Clear reply input
    setReplyText(prev => ({ ...prev, [annotationId]: '' }));
  };

  const handleSelectAnnotation = (annotation: TrackedAnnotation, pageIndex: number) => {
    if (provides && annotation.object?.id) {
      provides.selectAnnotation(pageIndex, annotation.object.id);
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAnnotationIcon = (type: string) => {
    // Return emoji or icon based on annotation type
    switch (type) {
      case 'Text':
      case 'note':
        return '📝';
      case 'Highlight':
      case 'highlight':
        return '🖍️';
      case 'Ink':
      case 'ink':
        return '✏️';
      case 'FreeText':
      case 'freeText':
        return '📄';
      case 'Square':
      case 'square':
        return '⬜';
      case 'Circle':
      case 'circle':
        return '⭕';
      case 'Line':
      case 'lineArrow':
        return '➡️';
      default:
        return '📌';
    }
  };

  return (
    <div className={panelClass}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Comentários</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {totalAnnotations}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {totalAnnotations === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma anotação ainda.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Use as ferramentas para adicionar anotações ao documento.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pageNumbers.map((pageIndex) => {
                const annotations = annotationsByPage[pageIndex];
                const isExpanded = expandedPages[pageIndex] !== false; // Default to expanded
                
                return (
                  <Collapsible
                    key={pageIndex}
                    open={isExpanded}
                    onOpenChange={() => togglePage(pageIndex)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Página {pageIndex + 1}</span>
                          <span className="text-xs text-muted-foreground">
                            ({annotations.length} {annotations.length === 1 ? 'anotação' : 'anotações'})
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-2 pb-2">
                      {annotations.map((annotation) => {
                        const annType = (annotation.object as any)?.subtype || (annotation.object as any)?.type || 'unknown';
                        const contents = (annotation.object as any)?.contents || '';
                        const createdAt = (annotation.object as any)?.creationDate;
                        const annotationId = annotation.object?.id || '';
                        
                        return (
                          <div
                            key={annotationId}
                            className={cn(
                              "ml-2 p-3 rounded-lg border border-border/50 bg-background cursor-pointer transition-colors",
                              "hover:border-primary/30 hover:bg-muted/30",
                              state?.selectedUid === annotationId && "border-primary bg-primary/5"
                            )}
                            onClick={() => handleSelectAnnotation(annotation, pageIndex)}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-lg">{getAnnotationIcon(annType)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-muted-foreground capitalize">
                                    {annType}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(createdAt)}
                                  </span>
                                </div>
                                
                                {contents && (
                                  <p className="text-sm mt-1 break-words">
                                    {contents}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Reply input */}
                            <div className="flex items-center gap-2 mt-3">
                              <Input
                                placeholder="Adicionar resposta..."
                                value={replyText[annotationId] || ''}
                                onChange={(e) => setReplyText(prev => ({
                                  ...prev,
                                  [annotationId]: e.target.value,
                                }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleReply(annotationId);
                                  }
                                }}
                                className="h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReply(annotationId);
                                }}
                                disabled={!replyText[annotationId]?.trim()}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
