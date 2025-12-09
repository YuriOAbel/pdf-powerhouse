import { create } from 'zustand';

export type Tool = 'select' | 'text' | 'highlight' | 'draw' | 'eraser' | 'image' | 'stamp';

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  thumbnail?: string;
}

export interface EditorState {
  // PDF state
  pdfFile: File | null;
  pdfUrl: string | null;
  pages: PDFPage[];
  currentPage: number;
  totalPages: number;
  
  // Tool state
  activeTool: Tool;
  brushColor: string;
  brushSize: number;
  highlightColor: string;
  textColor: string;
  fontSize: number;
  
  // Zoom state
  zoom: number;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  
  // UI state
  isLoading: boolean;
  isExportModalOpen: boolean;
  isProcessing: boolean;
  
  // Actions
  setPdfFile: (file: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setPages: (pages: PDFPage[]) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setActiveTool: (tool: Tool) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setHighlightColor: (color: string) => void;
  setTextColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setZoom: (zoom: number) => void;
  setCanUndo: (can: boolean) => void;
  setCanRedo: (can: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  reset: () => void;
}

const initialState = {
  pdfFile: null,
  pdfUrl: null,
  pages: [],
  currentPage: 1,
  totalPages: 0,
  activeTool: 'select' as Tool,
  brushColor: '#000000',
  brushSize: 2,
  highlightColor: '#FFEB3B',
  textColor: '#000000',
  fontSize: 16,
  zoom: 100,
  canUndo: false,
  canRedo: false,
  isLoading: false,
  isExportModalOpen: false,
  isProcessing: false,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,
  
  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setPages: (pages) => set({ pages }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setHighlightColor: (color) => set({ highlightColor: color }),
  setTextColor: (color) => set({ textColor: color }),
  setFontSize: (size) => set({ fontSize: size }),
  setZoom: (zoom) => set({ zoom }),
  setCanUndo: (can) => set({ canUndo: can }),
  setCanRedo: (can) => set({ canRedo: can }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  reset: () => set(initialState),
}));
