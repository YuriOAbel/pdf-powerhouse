/**
 * Converte PDF para texto usando OCR (Tesseract)
 * @param pdfBlob - Blob do PDF
 * @param filename - Nome do arquivo (sem extensão)
 * @param language - Idioma(s) para OCR (padrão: 'por+eng')
 * @returns Objeto com o texto extraído e metadados
 */
export async function convertPdfToText({
  pdfBlob,
  filename = 'documento',
  language = 'por+eng'
}: {
  pdfBlob: Blob;
  filename?: string;
  language?: string;
}): Promise<{
  success: boolean;
  text?: string;
  pages?: number;
  characters?: number;
  error?: string;
}> {
  try {
    // Converter Blob para base64
    const base64 = await blobToBase64(pdfBlob);
    
    // Remover prefixo data URL se existir
    const pdfBase64 = base64.includes('base64,') 
      ? base64.split('base64,')[1] 
      : base64;

    // Chamar Edge Function da Supabase
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convert-pdf-to-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          pdfBase64,
          filename,
          language
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na conversão: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro desconhecido na conversão');
    }

    return {
      success: true,
      text: result.text,
      pages: result.pages,
      characters: result.characters
    };

  } catch (error) {
    console.error('Erro ao converter PDF para texto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Faz download do texto extraído como arquivo .txt
 * @param text - Texto extraído
 * @param filename - Nome do arquivo (sem extensão)
 */
export function downloadTextFile(text: string, filename: string): void {
  try {
    // Criar Blob com o texto
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    
    // Criar URL temporária
    const url = URL.createObjectURL(blob);
    
    // Criar elemento <a> temporário
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar URL temporária
    URL.revokeObjectURL(url);
    
    console.log(`✅ Arquivo ${filename}.txt baixado com sucesso`);
  } catch (error) {
    console.error('Erro ao fazer download do arquivo de texto:', error);
    throw error;
  }
}

/**
 * Converte Blob para base64
 * @param blob - Blob a ser convertido
 * @returns Promise com string base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
