import {genkit} from 'genkit';
import {openAI} from 'genkitx-openai';
import {config} from 'dotenv';

config();

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseUrl: 'https://api.siliconflow.cn/v1',
    }),
  ],
});
