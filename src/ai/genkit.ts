'use server';

import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai/openai';
import {config} from 'dotenv';

config();

const plugins: Plugin<any>[] = [];

if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI());
}

if (process.env.SILICONFLOW_API_KEY) {
  plugins.push(openAI({
      name: 'siliconflow', // a unique name for the plugin
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseURL: process.env.SILICONFLOW_BASE_URL,
  }));
}


export const ai = genkit({
  plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
