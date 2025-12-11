import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConvertRequest {
  pdfBase64: string;
  format: "png" | "jpg";
  filename: string;
  quality?: number;
  scale?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pdfBase64, format, filename, quality = 92, scale = 2 }: ConvertRequest = await req.json();

    console.log(`🔄 Iniciando conversão: ${filename}.${format}`);
    console.log(`📊 Tamanho do PDF base64: ${pdfBase64.length} caracteres`);

    // Validar formato
    if (!["png", "jpg"].includes(format)) {
      throw new Error("Formato inválido. Use 'png' ou 'jpg'");
    }

    // Decodificar base64 para bytes
    let pdfBytes: Uint8Array;
    try {
      // Remove o prefixo data URL se existir
      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      pdfBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      console.log(`✅ PDF decodificado: ${pdfBytes.length} bytes`);
    } catch (decodeError) {
      console.error('❌ Erro ao decodificar base64:', decodeError);
      throw new Error('Erro ao decodificar PDF base64');
    }

    // Usar API externa para conversão (CloudConvert, ILovePDF, etc)
    // Por enquanto, vamos usar uma solução temporária com pdf-lib para validar o PDF
    
    // Importar pdf-lib para processar o PDF
    const { PDFDocument } = await import("https://cdn.skypack.dev/pdf-lib@1.17.1");
    
    let pdfDoc: any;
    let totalPages: number;
    
    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
      totalPages = pdfDoc.getPageCount();
      console.log(`📄 PDF carregado: ${totalPages} páginas`);
    } catch (loadError) {
      console.error('❌ Erro ao carregar PDF:', loadError);
      throw new Error('Erro ao processar o PDF. Verifique se o arquivo está correto.');
    }

    // Como não podemos renderizar no Deno facilmente, vamos retornar instruções
    // para o frontend fazer a renderização ou usar um serviço externo
    
    // SOLUÇÃO TEMPORÁRIA: Retornar erro explicativo
    throw new Error(
      'A conversão de PDF para imagem requer processamento mais complexo. ' +
      'Por favor, considere usar: 1) Renderização no frontend com PDF.js, ' +
      '2) Serviço externo como CloudConvert API, ou ' +
      '3) Container Docker com ImageMagick/Puppeteer'
    );

  } catch (error) {
    console.error("❌ Erro na conversão:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao converter PDF",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
