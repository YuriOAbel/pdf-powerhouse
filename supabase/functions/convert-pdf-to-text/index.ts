import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DOCKER_API_URL = "http://192.241.168.116:8080";

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    console.log('📄 Recebendo requisição de extração de texto...');
    
    const { pdfBase64, filename, language = 'por+eng' } = await req.json();
    
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'pdfBase64 é obrigatório' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    console.log(`📤 Enviando para Docker API... Filename: ${filename}, Language: ${language}`);
    console.log(`📦 Tamanho do PDF: ${pdfBase64.length} caracteres`);

    // Configurar timeout de 120 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(`${DOCKER_API_URL}/convert-pdf-to-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64,
          filename: filename || 'documento',
          language
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📥 Resposta do Docker: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro do Docker API: ${errorText}`);
        throw new Error(`Docker API retornou status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Extração completa: ${result.pages} páginas, ${result.characters} caracteres`);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ Timeout: Requisição demorou mais de 120 segundos');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Timeout: A extração de texto demorou muito tempo'
          }),
          {
            status: 408,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Erro ao processar requisição:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack?.substring(0, 500)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
})
