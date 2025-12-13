import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configurar worker do PDF.js para usar arquivo local na pasta public
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface ConvertToPngJpgOptions {
  pdfBlob: Blob;
  format: 'png' | 'jpg';
  filename: string;
  quality?: number;
  scale?: number;
  onProgress?: (current: number, total: number) => void;
}

export interface ConvertedImage {
  page: number;
  data: string; // data URL base64
}

export interface ConvertResult {
  success: boolean;
  totalPages: number;
  images: ConvertedImage[];
  format: string;
  filename: string;
  error?: string;
}

/**
 * Converte um PDF completo (com anotações do EmbedPDF) para PNG ou JPG
 * usando PDF.js no frontend (mais confiável que backend)
 */
export async function convertPdfToImages(
  options: ConvertToPngJpgOptions
): Promise<ConvertResult> {
  const { pdfBlob, format, filename, quality = 0.92, scale = 2, onProgress } = options;

  try {
    console.log('🔄 Iniciando conversão frontend com PDF.js...');
    
    // Converter Blob para ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    
    // Carregar PDF com PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    console.log(`📄 PDF carregado: ${totalPages} páginas`);

    const images: ConvertedImage[] = [];

    // Processar cada página
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`🖼️  Renderizando página ${pageNum}/${totalPages}`);
      
      if (onProgress) {
        onProgress(pageNum, totalPages);
      }

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Criar canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Não foi possível criar contexto do canvas');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Preencher fundo branco para JPG (transparência não suportada)
      if (format === 'jpg') {
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Renderizar página no canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      // Converter canvas para data URL
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const imageData = canvas.toDataURL(mimeType, quality);

      images.push({
        page: pageNum,
        data: imageData,
      });

      // Limpar canvas da memória
      canvas.remove();
    }

    console.log(`✅ Conversão completa: ${images.length} imagens geradas`);

    return {
      success: true,
      totalPages,
      images,
      format,
      filename,
    };
  } catch (error) {
    console.error('❌ Erro na conversão frontend:', error);
    return {
      success: false,
      totalPages: 0,
      images: [],
      format,
      filename,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Baixa uma imagem convertida
 */
export function downloadImage(imageData: string, filename: string, format: 'png' | 'jpg') {
  const link = document.createElement('a');
  link.href = imageData;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converte data URL para Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Cria um arquivo ZIP com todas as imagens
 */
async function createZipWithImages(
  images: ConvertedImage[],
  filename: string,
  format: 'png' | 'jpg'
): Promise<Blob> {
  const zip = new JSZip();
  
  // Adicionar cada imagem ao ZIP
  images.forEach((img) => {
    const pageFilename = `${filename}_pagina_${img.page}.${format}`;
    const blob = dataURLtoBlob(img.data);
    zip.file(pageFilename, blob);
  });
  
  // Gerar o arquivo ZIP
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  return zipBlob;
}

/**
 * Baixa um arquivo ZIP
 */
function downloadZip(zipBlob: Blob, filename: string) {
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Baixa todas as imagens:
 * - Se for apenas 1 página: baixa a imagem diretamente
 * - Se for 2+ páginas: cria um ZIP com todas as imagens
 */
export async function downloadAllImages(
  images: ConvertedImage[],
  filename: string,
  format: 'png' | 'jpg'
) {
  if (images.length === 1) {
    // Uma página apenas: baixar imagem diretamente
    console.log('📥 Baixando imagem única...');
    downloadImage(images[0].data, filename, format);
  } else {
    // Múltiplas páginas: criar ZIP
    console.log(`📦 Criando ZIP com ${images.length} imagens...`);
    const zipBlob = await createZipWithImages(images, filename, format);
    console.log('📥 Baixando arquivo ZIP...');
    downloadZip(zipBlob, filename);
  }
}
