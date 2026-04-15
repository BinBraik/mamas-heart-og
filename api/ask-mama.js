const fs = require('node:fs/promises');
const path = require('node:path');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CATALOG_PATH = path.join(process.cwd(), 'normalized', 'products.json');
const SUPPORTED_LANGUAGES = new Set(['en', 'ar']);
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_MESSAGE_LENGTH = 1000;

let cachedCatalog = null;

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function buildErrorPayload(code, message, details) {
  const payload = { error: { code, message } };
  if (details) {
    payload.error.details = details;
  }
  return payload;
}

function validateHistory(history) {
  if (history == null) {
    return { ok: true, value: [] };
  }

  if (!Array.isArray(history)) {
    return {
      ok: false,
      reason: 'chatHistory must be an array when provided.',
    };
  }

  if (history.length > MAX_HISTORY_ITEMS) {
    return {
      ok: false,
      reason: `chatHistory can include at most ${MAX_HISTORY_ITEMS} items.`,
    };
  }

  const sanitized = [];
  for (let i = 0; i < history.length; i += 1) {
    const item = history[i];
    const role = item?.role;
    const content = item?.content;

    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return {
        ok: false,
        reason: `chatHistory[${i}] must include role ('user' | 'assistant') and string content.`,
      };
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return {
        ok: false,
        reason: `chatHistory[${i}].content cannot be empty.`,
      };
    }

    if (trimmed.length > MAX_HISTORY_MESSAGE_LENGTH) {
      return {
        ok: false,
        reason: `chatHistory[${i}].content exceeds ${MAX_HISTORY_MESSAGE_LENGTH} characters.`,
      };
    }

    sanitized.push({ role, content: trimmed });
  }

  return { ok: true, value: sanitized };
}

async function loadCatalog() {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  const raw = await fs.readFile(CATALOG_PATH, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('normalized/products.json must contain an array of products.');
  }

  const normalizedProducts = parsed
    .filter((item) => item && typeof item === 'object' && item.product_id)
    .map((item) => ({
      productId: String(item.product_id),
      nameEn: typeof item.title_en === 'string' ? item.title_en : '',
      nameAr: typeof item.title_ar === 'string' ? item.title_ar : '',
      category: typeof item.category === 'string' ? item.category : '',
      ageMin: item.age_min,
      ageMax: item.age_max,
      priceSar: item.price_sar,
      shortDescriptionEn: typeof item.short_description_en === 'string' ? item.short_description_en : '',
      shortDescriptionAr: typeof item.short_description_ar === 'string' ? item.short_description_ar : '',
    }));

  if (!normalizedProducts.length) {
    throw new Error('Catalog is empty after normalization.');
  }

  cachedCatalog = {
    products: normalizedProducts,
    idSet: new Set(normalizedProducts.map((product) => product.productId)),
  };

  return cachedCatalog;
}

function buildSystemInstruction(language, catalogProducts) {
  const promptLanguage = language === 'ar' ? 'Arabic' : 'English';
  return [
    'You are Mama, a warm, practical shopping guide for toys and learning kits.',
    `Always answer in ${promptLanguage}.`,
    'Use a concise, supportive guidance tone suitable for parents.',
    'Recommend products strictly from the provided catalog context.',
    'Never invent product IDs, names, prices, or attributes not found in catalog context.',
    'If no suitable catalog product matches, provide guidance and return an empty recommendations array.',
    'Output must be valid minified JSON with this exact schema:',
    '{"assistant_text":string,"recommendations":[{"product_id":string,"rationale":string}]}',
    'Do not include markdown, code fences, or extra keys.',
    `Catalog context: ${JSON.stringify(catalogProducts)}`,
  ].join(' ');
}

function parseModelJson(content) {
  if (typeof content !== 'string') {
    throw new Error('Model returned non-string content.');
  }

  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

function normalizeModelResponse(modelResponse, catalogIds) {
  const assistantText = typeof modelResponse?.assistant_text === 'string'
    ? modelResponse.assistant_text.trim()
    : '';

  const rawRecommendations = Array.isArray(modelResponse?.recommendations)
    ? modelResponse.recommendations
    : [];

  if (!assistantText) {
    throw new Error('assistant_text is missing or empty in model response.');
  }

  const recommendedProductIds = [];
  const rationaleByProductId = {};

  for (const recommendation of rawRecommendations) {
    const productId = typeof recommendation?.product_id === 'string'
      ? recommendation.product_id.trim()
      : '';
    const rationale = typeof recommendation?.rationale === 'string'
      ? recommendation.rationale.trim()
      : '';

    if (!productId || !rationale) {
      continue;
    }

    if (!catalogIds.has(productId)) {
      continue;
    }

    if (recommendedProductIds.includes(productId)) {
      continue;
    }

    recommendedProductIds.push(productId);
    rationaleByProductId[productId] = rationale;
  }

  return {
    assistantText,
    recommendedProductIds,
    rationaleByProductId,
  };
}

async function callOpenRouter({ apiKey, language, message, history, catalogProducts }) {
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  const systemInstruction = buildSystemInstruction(language, catalogProducts);

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history,
    { role: 'user', content: message },
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://mamas-heart.local',
      'X-Title': process.env.OPENROUTER_X_TITLE || 'Mama\'s Heart Ask Mama API',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`LLM provider request failed with ${response.status}: ${bodyText.slice(0, 300)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const parsed = parseModelJson(content);

  return parsed;
}

async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  let data = '';
  for await (const chunk of req) {
    data += chunk;
  }

  if (!data) {
    return {};
  }

  return JSON.parse(data);
}

module.exports = async function askMamaHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, buildErrorPayload('method_not_allowed', 'Only POST is supported.'));
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return sendJson(
      res,
      500,
      buildErrorPayload('server_misconfigured', 'Missing OPENROUTER_API_KEY server configuration.'),
    );
  }

  let body;
  try {
    body = await parseRequestBody(req);
  } catch {
    return sendJson(res, 400, buildErrorPayload('invalid_json', 'Request body must be valid JSON.'));
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const language = typeof body?.language === 'string' ? body.language.trim().toLowerCase() : '';

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return sendJson(
      res,
      400,
      buildErrorPayload(
        'invalid_message',
        `message is required and must be 1-${MAX_MESSAGE_LENGTH} characters.`,
      ),
    );
  }

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return sendJson(res, 400, buildErrorPayload('invalid_language', 'language must be "en" or "ar".'));
  }

  const historyValidation = validateHistory(body?.chatHistory);
  if (!historyValidation.ok) {
    return sendJson(
      res,
      400,
      buildErrorPayload('invalid_chat_history', historyValidation.reason),
    );
  }

  let catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    return sendJson(
      res,
      500,
      buildErrorPayload('catalog_unavailable', 'Could not load product catalog.', error.message),
    );
  }

  try {
    const modelResponse = await callOpenRouter({
      apiKey,
      language,
      message,
      history: historyValidation.value,
      catalogProducts: catalog.products,
    });

    const normalized = normalizeModelResponse(modelResponse, catalog.idSet);

    return sendJson(res, 200, {
      assistantText: normalized.assistantText,
      recommendedProductIds: normalized.recommendedProductIds,
      rationaleByProductId: normalized.rationaleByProductId,
    });
  } catch (error) {
    return sendJson(
      res,
      502,
      buildErrorPayload('assistant_unavailable', 'Failed to generate assistant recommendation.', error.message),
    );
  }
};
