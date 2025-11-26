'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai/openai';
import { config } from 'dotenv';

config();

// Configure the OpenAI-compatible plugin for SiliconFlow
if (process.env.SILICONFLOW_API_KEY && process.env.SILICONFLOW_BASE_URL) {
  openAI.configure({
    apiKey: process.env.SILICONFLOW_API_KEY,
    baseURL: process.env.SILICONFLOW_BASE_URL,
  });
}

// Initialize Genkit with plugins
export const ai = genkit({
  plugins: [
    // Conditionally add Google AI plugin if the key is present
    ...(process.env.GEMINI_API_KEY ? [googleAI()] : []),
    // Add the configured OpenAI-compatible plugin
    openAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
