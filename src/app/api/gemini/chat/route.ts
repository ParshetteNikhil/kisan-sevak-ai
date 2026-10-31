import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      history = [],
      modelTier = 'general', // 'fast' | 'general' | 'complex'
      role = 'agronomist',   // 'agronomist' | 'market_strategist' | 'bioscience_specialist' | 'soil_expert'
      grounding = 'none',    // 'none' | 'search' | 'maps'
      userLocation,          // { latitude: number, longitude: number }
      locale = 'en',
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const ai = getGeminiClient();

    // Model selection based on requirements:
    // gemini-4-argon for particularly complex tasks, gemini-3.8-flash for general tasks, gemini-3.1-flash-lite for fast tasks.
    // When search or maps grounding is requested, use gemini-3.8-flash.
    let selectedModel = 'gemini-3.8-flash';
    if (grounding === 'search' || grounding === 'maps') {
      selectedModel = 'gemini-3.8-flash';
    } else if (modelTier === 'complex') {
      selectedModel = 'gemini-4-argon';
    } else if (modelTier === 'fast') {
      selectedModel = 'gemini-3.1-flash-lite';
    }

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
When citing prices, fertilizers, dosages, or scientific data, be precise and safe. Always warn farmers about protective equipment when handling agrochemicals.`;

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

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

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

    return NextResponse.json({
      text: replyText,
      modelUsed: selectedModel,
      groundingUsed: grounding,
      searchCitations,
      mapLocations,
    });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to process Gemini chat request',
      },
      { status: 500 }
    );
  }
}
