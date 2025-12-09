import { create } from 'zustand';

export interface EditorState {
  // PDF state
  pdfFile: File | null;
  pdfUrl: string | null;
  
  // UI state
  isLoading: boolean;
  isExportModalOpen: boolean;
  isProcessing: boolean;
  
  // Actions
  setPdfFile: (file: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  reset: () => void;
}

const initialState = {
  pdfFile: null,
  pdfUrl: null,
  isLoading: false,
  isExportModalOpen: false,
  isProcessing: false,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,
  
  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  reset: () => set(initialState),
}));
