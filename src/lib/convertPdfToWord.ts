import { supabase } from '@/integrations/supabase/client';

export interface ConvertToWordOptions {
  pdfBlob: Blob;
  filename: string;
}

export interface ConvertToWordResult {
  success: boolean;
  filename: string;
  data?: string; // base64 do arquivo Word
  totalPages?: number;
  message?: string;
  error?: string;
}

/**
 * Converte um PDF completo (com anotações do EmbedPDF) para Word (.docx)
 * usando Supabase Edge Function
 */
export async function convertPdfToWord(
  options: ConvertToWordOptions
): Promise<ConvertToWordResult> {
  const { pdfBlob, filename } = options;

  try {
    console.log('🔄 Iniciando conversão PDF → Word via backend...');
    
    // Converter Blob para Base64
    const base64 = await blobToBase64(pdfBlob);
    
    // Remover prefixo data:application/pdf;base64,
    const pdfBase64 = base64.split(',')[1] || base64;

    // Chamar Edge Function
    console.log('📤 Enviando PDF para Edge Function...');
    const { data, error } = await supabase.functions.invoke('convert-pdf-to-word', {
      body: {
        pdfBase64,
        filename,
      },
    });

    if (error) {
      console.error('❌ Erro ao chamar Edge Function:', error);
      throw new Error(error.message || 'Erro ao processar PDF no servidor');
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido na conversão');
    }

    console.log('✅ Conversão concluída!');
    return data as ConvertToWordResult;
  } catch (error) {
    console.error('❌ Erro na conversão para Word:', error);
    return {
      success: false,
      filename: `${filename}.docx`,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Converte Blob para Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Erro ao converter blob para base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Baixa o arquivo Word gerado
 */
export function downloadWordFile(base64Data: string, filename: string) {
  try {
    // Converter base64 para Blob
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Criar link de download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ Download iniciado:', link.download);
  } catch (error) {
    console.error('❌ Erro ao fazer download:', error);
    throw error;
  }
}
