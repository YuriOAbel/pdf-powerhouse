import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DOCKER_API_URL = "http://192.241.168.116:8080";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📥 Recebendo request de compressão de PDF...");

    // Obter o PDF em base64 do request
    const { pdfBase64, filename, quality = "ebook" } = await req.json();

    if (!pdfBase64) {
      throw new Error("PDF base64 não fornecido");
    }

    console.log(`📄 Comprimindo PDF: ${filename || "documento"} (qualidade: ${quality})`);
    console.log(`📦 Tamanho do base64: ${pdfBase64.length} caracteres`);

    // Chamar API Docker para comprimir
    console.log(`🔄 Enviando para Docker API: ${DOCKER_API_URL}/compress-pdf`);
    
    const dockerResponse = await fetch(`${DOCKER_API_URL}/compress-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pdfBase64,
        filename: filename || "documento",
        quality: quality || "ebook",
      }),
    });

    if (!dockerResponse.ok) {
      const errorText = await dockerResponse.text();
      console.error(`❌ Erro Docker API: ${errorText}`);
      throw new Error(`Docker API error: ${errorText}`);
    }

    const result = await dockerResponse.json();
    console.log("✅ Compressão completa!");
    console.log(`📊 Taxa de compressão: ${result.compression_ratio_percent}%`);

    // Retornar resultado
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
