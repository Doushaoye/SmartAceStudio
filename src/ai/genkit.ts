import {genkit} from 'genkit';
import {openai} from 'genkitx-openai';
import {config} from 'dotenv';

config();

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseUrl: 'https://api.siliconflow.cn/v1',
    }),
  ],
  model: 'THUDM/GLM-4.1V-9B-Thinking',
});
