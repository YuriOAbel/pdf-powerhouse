import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// URL do serviço Docker no DigitalOcean
const DOCKER_API_URL = "http://192.241.168.116:8080";

interface ConvertRequest {
  pdfBase64: string;
  filename: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pdfBase64, filename }: ConvertRequest = await req.json();

    console.log(`🔄 Conversão PDF → Word: ${filename}.docx`);
    console.log(`📦 Tamanho: ${pdfBase64.length} chars`);
    
    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos
    
    try {
      console.log(`🐳 Chamando Docker API: ${DOCKER_API_URL}/convert-pdf-to-word`);
      
      const response = await fetch(`${DOCKER_API_URL}/convert-pdf-to-word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64, filename }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Docker API erro: ${response.status} - ${errorText}`);
        throw new Error(`Docker API retornou ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const result = await response.json();
      console.log('✅ Conversão completa!');

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: A conversão demorou muito tempo (>120s)');
        }
        console.error(`❌ Erro na requisição: ${fetchError.message}`);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("❌ Erro na conversão:", error);
    
    let errorMessage = "Erro desconhecido";
    let errorDetails = "";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || "";
    }
    
    console.error("Detalhes:", errorDetails);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorDetails.substring(0, 500),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
