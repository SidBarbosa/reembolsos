// ============================================
// CaixinhaApp — Cloudflare Worker (Proxy Seguro para OCR Gemini)
// ============================================
//
// COMO USAR NO CLOUDFLARE WORKERS:
// 1. Crie um Worker em https://workers.cloudflare.com
// 2. Cole este código no arquivo worker.js do painel
// 3. Vá em Settings > Variables e adicione a variável secreta:
//    GEMINI_API_KEY = "sua_chave_do_google_ai_aqui"
// 4. (Opcional) Altere ALLOWED_ORIGIN abaixo para o seu link do GitHub Pages

const ALLOWED_ORIGIN = '*'; // Ex: 'https://seu-usuario.github.io'

export default {
  async fetch(request, env) {
    // 1. Tratar CORS Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 2. Permitir apenas método POST na rota /api/ocr
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: getCorsHeaders(),
      });
    }

    try {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Chave GEMINI_API_KEY não configurada no servidor' }),
          { status: 500, headers: getCorsHeaders() }
        );
      }

      // Recebe o body enviado pelo front-end (base64 da imagem ou prompt)
      const payload = await request.json();

      // Chamada oficial segura ao Google Gemini 1.5 Flash
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await geminiResponse.json();

      return new Response(JSON.stringify(result), {
        status: geminiResponse.status,
        headers: getCorsHeaders(),
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Erro no servidor Worker', details: error.message }),
        { status: 500, headers: getCorsHeaders() }
      );
    }
  },
};

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Content-Type': 'application/json',
  };
}
