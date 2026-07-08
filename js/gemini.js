// ============================================
// CaixinhaApp — Gemini API Integration
// ============================================

// Lista de modelos gratuitos com rodízio automático no frontend
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
let currentGeminiModelIndex = 0;

const EXTRACTION_PROMPT = `Analise esta imagem de uma nota fiscal, cupom fiscal ou recibo brasileiro.
Extraia as seguintes informações e retorne APENAS um JSON válido (sem markdown, sem crases, sem texto adicional):
{
  "loja": "Nome do estabelecimento/loja (fantasia)",
  "numero_nota": "Número da nota fiscal, cupom fiscal, extrato ou pedido (ex: 100384, 000123, CCF 021)",
  "valor": 0.00,
  "data": "YYYY-MM-DD"
}

Regras:
- "valor" deve ser um número decimal do VALOR TOTAL A PAGAR da nota (ex: 245.90, use ponto como separador decimal)
- "loja" deve ser o nome fantasia ou marca principal (não o CNPJ ou razão social longa se houver nome fantasia)
- "numero_nota" é o número identificador do documento fiscal. ATENÇÃO: em todas ou quase todas as notas brasileiras, o número da notinha está precedido pelo prefixo "NFC-e n°", "NFC-e nº", "EXTRATO Nº", "COO", "CCF", "Nº Nota" ou "Pedido". Procure especificamente por esses termos para localizar e extrair o número correto da nota.
- "data" deve estar no formato YYYY-MM-DD
- Se não conseguir identificar algum campo com certeza, coloque null
- Retorne SOMENTE o JSON, nada mais`;

/**
 * Analyze a receipt image using Gemini API with automatic model rotation
 * @param {string} imageBase64 - Base64 encoded image (data URL or raw base64)
 * @param {string} apiKey - Gemini API key
 * @returns {Object} - { loja, valor, itens, data }
 */
async function analyzeReceipt(imageBase64, apiKey) {
  if (!apiKey) {
    throw new Error('API Key do Gemini não configurada. Vá em Configurações para adicionar.');
  }

  // Extract raw base64 and mime type from data URL
  let mimeType = 'image/jpeg';
  let rawBase64 = imageBase64;

  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      rawBase64 = match[2];
    }
  }

  const requestBody = {
    contents: [{
      parts: [
        { text: EXTRACTION_PROMPT },
        {
          inline_data: {
            mime_type: mimeType,
            data: rawBase64
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      response_mime_type: 'application/json'
    }
  };

  // Se a chave configurada for uma URL (Cloudflare Worker seguro)
  if (apiKey.startsWith('http://') || apiKey.startsWith('https://')) {
    const response = await fetch(apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error || `Erro no servidor Worker (${response.status})`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Não foi possível analisar a nota. Tente com uma foto mais clara.');
    }
    return parseGeminiResponse(text);
  }

  let lastErrorMsg = '';
  for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
    const modelName = GEMINI_MODELS[(currentGeminiModelIndex + attempt) % GEMINI_MODELS.length];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 429) {
        // Cota excedida neste modelo, tenta o próximo no rodízio
        console.warn(`[Gemini] Cota excedida no modelo ${modelName}. Alternando para o próximo modelo...`);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        if (status === 400) {
          throw new Error('Imagem inválida ou não reconhecida. Tente outra foto.');
        } else if (status === 401 || status === 403) {
          throw new Error('API Key inválida. Verifique sua chave em Configurações.');
        }
        lastErrorMsg = errorData?.error?.message || `Erro HTTP ${status}`;
        continue;
      }

      // Sucesso! Atualiza o modelo atual no rodízio
      currentGeminiModelIndex = (currentGeminiModelIndex + attempt) % GEMINI_MODELS.length;
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Não foi possível analisar a nota. Tente com uma foto mais clara.');
      }

      return parseGeminiResponse(text);
    } catch (e) {
      if (e.message && (e.message.includes('API Key inválida') || e.message.includes('Imagem inválida'))) {
        throw e;
      }
      lastErrorMsg = e.message;
    }
  }

  throw new Error(`Limite de uso diário atingido em todos os modelos da IA. Tente novamente mais tarde.`);
}

/**
 * Parse Gemini response text to extract JSON
 * Handles cases where the response might be wrapped in markdown code blocks
 */
function parseGeminiResponse(text) {
  let jsonStr = text.trim();

  // Remove markdown code block if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(jsonStr);

    let val = parsed.valor;
    if (typeof val === 'string') {
      val = parseFloat(val.replace(',', '.'));
    }

    const numNota = typeof parsed.numero_nota === 'string' ? parsed.numero_nota.trim() : (typeof parsed.numero_nota === 'number' ? String(parsed.numero_nota) : null);
    const loja = typeof parsed.loja === 'string' ? parsed.loja.trim() : null;
    const itens = numNota ? `Nº Nota: ${numNota}` : (typeof parsed.itens === 'string' ? parsed.itens.trim() : '');
    const data = typeof parsed.data === 'string' ? parsed.data.trim() : null;

    // Validate and clean the response
    return {
      loja: loja,
      valor: typeof val === 'number' && !isNaN(val) ? val : null,
      itens: itens,
      data: data
    };
  } catch (e) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Não foi possível interpretar a resposta da IA. Tente novamente.');
  }
}

/**
 * Resize image to reduce size before sending to API
 * @param {File|Blob} imageFile
 * @param {number} maxDimension - Max width or height in pixels
 * @returns {Promise<string>} - Base64 data URL of resized image
 */
async function resizeImage(imageFile, maxDimension = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if larger than max dimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao processar a imagem.'));
    };

    img.src = url;
  });
}

/**
 * Validate if API key format looks correct
 */
function isValidApiKeyFormat(key) {
  return typeof key === 'string' && key.trim().length >= 20;
}
