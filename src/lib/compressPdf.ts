import { supabase } from '@/integrations/supabase/client';

export interface CompressPdfOptions {
  pdfBlob: Blob;
  filename: string;
  quality?: 'screen' | 'ebook' | 'printer' | 'prepress';
}

export interface CompressPdfResult {
  success: boolean;
  filename?: string;
  data?: string; // PDF comprimido em base64
  originalSizeBytes?: number;
  compressedSizeBytes?: number;
  compressionRatioPercent?: number;
  quality?: string;
  error?: string;
}

/**
 * Converte Blob para base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remover prefixo data URL
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converte base64 para Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }

  return new Blob([new Uint8Array(byteArrays)], { type: mimeType });
}

/**
 * Comprime um PDF usando Ghostscript no backend
 * 
 * Níveis de qualidade:
 * - screen: 72 DPI - menor tamanho, menor qualidade
 * - ebook: 150 DPI - boa compressão, qualidade razoável (padrão)
 * - printer: 300 DPI - boa qualidade, compressão moderada
 * - prepress: 300 DPI - melhor qualidade, menor compressão
 */
export async function compressPdf(
  options: CompressPdfOptions
): Promise<CompressPdfResult> {
  const { pdfBlob, filename, quality = 'ebook' } = options;

  try {
    console.log('🔄 Iniciando compressão de PDF...');
    console.log(`📄 Arquivo: ${filename}`);
    console.log(`📊 Tamanho original: ${pdfBlob.size} bytes`);
    console.log(`⚙️ Qualidade: ${quality}`);

    // Converter Blob para base64
    const pdfBase64 = await blobToBase64(pdfBlob);

    // Chamar Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('compress-pdf', {
      body: {
        pdfBase64,
        filename,
        quality,
      },
    });

    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro na compressão');
    }

    console.log('✅ Compressão completa!');
    console.log(`📦 Tamanho comprimido: ${data.compressed_size_bytes} bytes`);
    console.log(`📊 Redução: ${data.compression_ratio_percent}%`);

    return {
      success: true,
      filename: data.filename,
      data: data.data,
      originalSizeBytes: data.original_size_bytes,
      compressedSizeBytes: data.compressed_size_bytes,
      compressionRatioPercent: data.compression_ratio_percent,
      quality: data.quality,
    };
  } catch (error) {
    console.error('❌ Erro na compressão:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Baixa o PDF comprimido
 */
export function downloadCompressedPdf(base64Data: string, filename: string) {
  const blob = base64ToBlob(base64Data, 'application/pdf');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
