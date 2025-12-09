import { create } from 'zustand';

export type Tool = 'select' | 'text' | 'highlight' | 'draw' | 'eraser' | 'image' | 'stamp' | 'note';

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  thumbnail?: string;
}

export interface TextSettings {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  alignment: 'left' | 'center' | 'right';
}

export interface DrawSettings {
  strokeWidth: number;
  strokeColor: string;
  opacity: number;
}

export interface StampSettings {
  type: 'approved' | 'reviewed' | 'paid' | 'custom';
  customText: string;
  color: string;
}

export interface NoteSettings {
  text: string;
  color: string;
  style: 'sticky' | 'comment' | 'flag' | 'star';
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
  
  // Tool settings
  showToolPanel: boolean;
  textSettings: TextSettings;
  drawSettings: DrawSettings;
  stampSettings: StampSettings;
  noteSettings: NoteSettings;
  
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
  setShowToolPanel: (show: boolean) => void;
  setTextSettings: (settings: Partial<TextSettings>) => void;
  setDrawSettings: (settings: Partial<DrawSettings>) => void;
  setStampSettings: (settings: Partial<StampSettings>) => void;
  setNoteSettings: (settings: Partial<NoteSettings>) => void;
  reset: () => void;
}

const initialTextSettings: TextSettings = {
  fontFamily: 'Arial',
  fontSize: 16,
  fontColor: '#000000',
  isBold: false,
  isItalic: false,
  isUnderline: false,
  alignment: 'left',
};

const initialDrawSettings: DrawSettings = {
  strokeWidth: 2,
  strokeColor: '#000000',
  opacity: 100,
};

const initialStampSettings: StampSettings = {
  type: 'approved',
  customText: '',
  color: '#ef4444',
};

const initialNoteSettings: NoteSettings = {
  text: '',
  color: '#fbbf24',
  style: 'sticky',
};

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
  showToolPanel: false,
  textSettings: initialTextSettings,
  drawSettings: initialDrawSettings,
  stampSettings: initialStampSettings,
  noteSettings: initialNoteSettings,
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
  setActiveTool: (tool) => set({ 
    activeTool: tool, 
    showToolPanel: tool !== 'select' && tool !== 'eraser' 
  }),
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
  setShowToolPanel: (show) => set({ showToolPanel: show }),
  setTextSettings: (settings) => set((state) => ({ 
    textSettings: { ...state.textSettings, ...settings } 
  })),
  setDrawSettings: (settings) => set((state) => ({ 
    drawSettings: { ...state.drawSettings, ...settings } 
  })),
  setStampSettings: (settings) => set((state) => ({ 
    stampSettings: { ...state.stampSettings, ...settings } 
  })),
  setNoteSettings: (settings) => set((state) => ({ 
    noteSettings: { ...state.noteSettings, ...settings } 
  })),
  reset: () => set(initialState),
}));
