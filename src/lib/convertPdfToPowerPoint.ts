/**
 * Converte PDF para PowerPoint (.pptx) usando unoconv + LibreOffice
 * @param pdfBlob - Blob do PDF
 * @param filename - Nome do arquivo (sem extensão)
 * @returns Objeto com o resultado da conversão
 */
export async function convertPdfToPowerPoint({
  pdfBlob,
  filename = 'documento'
}: {
  pdfBlob: Blob;
  filename?: string;
}): Promise<{
  success: boolean;
  data?: string;
  size_bytes?: number;
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
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convert-pdf-to-pptx`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          pdfBase64,
          filename
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
      data: result.data,
      size_bytes: result.size_bytes
    };

  } catch (error) {
    console.error('Erro ao converter PDF para PowerPoint:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Faz download do arquivo PowerPoint
 * @param base64Data - Dados do PowerPoint em base64
 * @param filename - Nome do arquivo (sem extensão)
 */
export function downloadPowerPointFile(base64Data: string, filename: string): void {
  try {
    // Converter base64 para Blob (formato PPTX)
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
    
    // Criar URL temporária
    const url = URL.createObjectURL(blob);
    
    // Criar elemento <a> temporário
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pptx`;
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar URL temporária
    URL.revokeObjectURL(url);
    
    console.log(`✅ Arquivo ${filename}.pptx baixado com sucesso`);
  } catch (error) {
    console.error('Erro ao fazer download do arquivo PowerPoint:', error);
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
