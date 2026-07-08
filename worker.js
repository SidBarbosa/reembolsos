const ALLOWED_ORIGIN = '*'; 

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

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

      const payload = await request.json();

      // Lista de modelos com rodízio automático e fallback
      const GEMINI_MODELS = [
        'gemini-2.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash',
        'gemini-1.5-flash'
      ];

      let lastResult = null;
      let lastStatus = 500;

      for (const modelName of GEMINI_MODELS) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        lastStatus = geminiResponse.status;

        // Se deu erro de cota (429) ou modelo não encontrado (404), tenta o próximo modelo da lista
        if (lastStatus === 429 || lastStatus === 404) {
          continue;
        }

        lastResult = await geminiResponse.json();
        return new Response(JSON.stringify(lastResult), {
          status: lastStatus,
          headers: getCorsHeaders(),
        });
      }

      // Se nenhum modelo respondeu com sucesso
      return new Response(
        JSON.stringify(lastResult || { error: 'Todos os modelos falharam ou excederam cota.' }),
        { status: lastStatus, headers: getCorsHeaders() }
      );
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
