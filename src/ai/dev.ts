'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/weather-based-suggestions.ts';
import '@/ai/flows/soil-analysis-flow.ts';
import '@/ai/flows/diagnose-crop-flow.ts';
import '@/ai/flows/generate-schedule-flow.ts';
import '@/ai/flows/profitability-forecast-flow.ts';
import '@/ai/flows/irrigation-suggestion-flow.ts';
import '@/ai/flows/agri-chat-flow.ts';
import '@/ai/flows/inter-state-price-flow.ts';
