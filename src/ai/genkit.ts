import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai/openai';
import {config} from 'dotenv';

config();

const plugins: Plugin<any>[] = [];

if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI());
}

// 默认启用 SiliconFlow (或其他 OpenAI 兼容) 插件
// 即使没有 SILICONFLOW_API_KEY，也加载它，允许从 .env 文件或其他方式配置
plugins.push(openAI({
    name: 'siliconflow', // a unique name for the plugin
    apiKey: process.env.SILICONFLOW_API_KEY,
    baseURL: process.env.SILICONFLOW_BASE_URL,
}));


export const ai = genkit({
  plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
