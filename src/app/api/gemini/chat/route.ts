import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { requireAiUser, AuthError } from '@/lib/server-auth';

// Same question asked again (e.g. the same crop price on the same day) is answered from memory
// for 6 hours, so repeat taps do not use AI quota.
const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; body: unknown }>();
const isQuota = (e: any) => [429, 402].includes(Number(e?.status)) || /RESOURCE_EXHAUSTED|quota/i.test(String(e?.message));

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    await requireAiUser(authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

    const body = await req.json();
    const {
      message,
      history = [],
      modelTier = 'general', // 'fast' | 'general' | 'complex'
      role = 'agronomist',   // 'agronomist' | 'market_strategist' | 'bioscience_specialist' | 'soil_expert'
      grounding = 'none',    // 'none' | 'search' | 'maps'
      userLocation,          // { latitude: number, longitude: number }
      locale = 'en',
      farmContext = '',
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (message.length > 4000 || !Array.isArray(history) || history.length > 40) {
      return NextResponse.json({ error: 'Message or conversation is too long. Start a new chat.' }, { status: 413 });
    }

    const ai = getGeminiClient();

    // Model selection based on requirements:
    // gemini-4-argon for particularly complex tasks, gemini-3.8-flash for general tasks, gemini-3.1-flash-lite for fast tasks.
    // When search or maps grounding is requested, use gemini-3.8-flash.
    // Free-tier friendly: the light model answers by default; the stronger one is the backup.
    const LIGHT = process.env.CHAT_MODEL || 'gemini-3.1-flash-lite';
    const BACKUP = process.env.CHAT_BACKUP_MODEL || 'gemini-3.8-flash';
    let selectedModel = modelTier === 'complex' ? 'gemini-4-argon' : LIGHT;

    // Role-specific System Instructions
    let roleDescription = 'You are Kisaan Sevak Agri-Consultant, a trusted master agronomist.';
    if (role === 'market_strategist') {
      roleDescription = 'You are Kisaan Sevak Market & Commodity Strategist, an expert in Indian APMC mandis, MSP rates, fair buyer pricing, post-harvest storage, and logistics.';
    } else if (role === 'bioscience_specialist') {
      roleDescription = 'You are Kisaan Sevak Bioscience Specialist, an expert in agricultural biotechnology, plant pathology, agrochemicals (NPK, bio-fertilizers, organic fungicides), mode of action, and chemical safety.';
    } else if (role === 'soil_expert') {
      roleDescription = 'You are Kisaan Sevak Soil & Irrigation Advisor, specializing in soil pH, N-P-K nutrient balancing, organic carbon, micro-irrigation, and climate resilience.';
    }

    const systemInstruction = `${roleDescription}
Your objective is to provide actionable, practical, respectful, and highly accurate advice to Indian farmers, agronomists, and agricultural buyers.
Explain complex agricultural and bioscience concepts clearly, avoiding unnecessary jargon or explaining technical terms when helpful.
Respond entirely in the requested language corresponding to locale: "${locale}" (e.g. en = English, hi = Hindi, bn = Bengali, pa = Punjabi, mr = Marathi, te = Telugu, ta = Tamil, kn = Kannada, gu = Gujarati).
When citing prices, fertilizers, dosages, or scientific data, be precise and safe. Always warn farmers about protective equipment when handling agrochemicals.
Many users cannot read well and will LISTEN to your answer: use short sentences, everyday words, no tables, at most 6 bullet points, and Indian units (quintal, acre, ₹).
${typeof farmContext === 'string' && farmContext ? `This farmer's farm: ${farmContext.slice(0, 1500)}. Use it to make advice specific to their field.` : ''}`;

    // Build configuration
    const config: any = {
      systemInstruction,
    };

    // Configure tools if grounding is requested
    if (grounding === 'search') {
      config.tools = [{ googleSearch: {} }];
    } else if (grounding === 'maps') {
      config.tools = [{ googleMaps: {} }];
      if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
          },
        };
      }
    }

    // Format conversation history
    const contents: any[] = [];
    for (const item of history) {
      if (item && item.text && (item.role === 'user' || item.role === 'model')) {
        contents.push({
          role: item.role,
          parts: [{ text: item.text }],
        });
      }
    }
    // Append current user turn
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const cacheKey = history.length === 0 ? JSON.stringify([message, locale, role, grounding, modelTier, farmContext]) : '';
    const hit = cacheKey ? cache.get(cacheKey) : undefined;
    if (hit && Date.now() - hit.at < CACHE_MS) return NextResponse.json(hit.body);

    let response;
    try {
      response = await ai.models.generateContent({ model: selectedModel, contents, config });
    } catch (e) {
      // Quota reached on the main model: answer with the lighter model instead of failing.
      if (!isQuota(e) || selectedModel === BACKUP) throw e;
      selectedModel = BACKUP;
      response = await ai.models.generateContent({ model: selectedModel, contents, config });
    }

    const replyText = response.text || '';

    // Extract grounding information
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];

    const searchCitations: { title: string; uri: string }[] = [];
    const mapLocations: { title: string; uri: string; snippet?: string }[] = [];

    for (const chunk of groundingChunks) {
      if ((chunk as any).web?.uri) {
        searchCitations.push({
          title: (chunk as any).web.title || (chunk as any).web.uri,
          uri: (chunk as any).web.uri,
        });
      }
      if ((chunk as any).maps?.uri) {
        mapLocations.push({
          title: (chunk as any).maps.title || 'Location details on Google Maps',
          uri: (chunk as any).maps.uri,
          snippet: (chunk as any).maps.placeAnswerSources?.reviewSnippets?.[0]?.text,
        });
      }
    }

    const result = { text: replyText, modelUsed: selectedModel, groundingUsed: grounding, searchCitations, mapLocations };
    if (cacheKey && replyText) {
      if (cache.size > 500) cache.delete(cache.keys().next().value as string);
      cache.set(cacheKey, { at: Date.now(), body: result });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Gemini Chat API Error:', error);
    if (isQuota(error)) {
      return NextResponse.json({ error: 'busy', code: 'busy' }, { status: 503 });
    }
    return NextResponse.json({ error: 'unavailable', code: 'busy' }, { status: 500 });
  }
}
