import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import GeminiEmbedding from './geminiEmbedding';
import BaseEmbedding from '../../base/embedding';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import GeminiLLM from './geminiLLM';

interface GeminiConfig {
  apiKey: string;
}

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your Gemini API key',
    required: true,
    placeholder: 'Gemini API Key',
    env: 'GEMINI_API_KEY',
    scope: 'server',
  },
];

class GeminiProvider extends BaseModelProvider<GeminiConfig> {
  constructor(id: string, name: string, config: GeminiConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await res.json();

    const retiredModels = new Set([
      'models/gemini-2.5-flash',
      'models/gemini-2.5-pro',
      'models/gemini-2.5-flash-lite',
      'models/gemini-2.5-flash-image',
      'models/gemini-2.5-computer-use-preview-10-2025',
      'models/text-embedding-004',
    ]);

    const activeChatModels: Model[] = [];
    const activeEmbeddingModels: Model[] = [];

    if (Array.isArray(data.models)) {
      data.models.forEach((m: any) => {
        if (retiredModels.has(m.name)) return;

        if (
          m.supportedGenerationMethods?.some(
            (genMethod: string) =>
              genMethod === 'embedText' || genMethod === 'embedContent',
          )
        ) {
          activeEmbeddingModels.push({
            key: m.name,
            name: m.displayName || m.name,
          });
        } else if (m.supportedGenerationMethods?.includes('generateContent')) {
          activeChatModels.push({
            key: m.name,
            name: m.displayName || m.name,
          });
        }
      });
    }

    // Sort to ensure the fastest, active, tested models appear at the top
    const priorityChatOrder = [
      'models/gemini-3.5-flash',
      'models/gemini-3.1-flash-lite',
      'models/gemini-3.8-flash',
      'models/gemini-flash-latest',
      'models/gemini-3.7-flash',
      'models/gemini-3.6-flash',
      'models/gemini-pro-latest',
    ];

    activeChatModels.sort((a, b) => {
      const idxA = priorityChatOrder.indexOf(a.key);
      const idxB = priorityChatOrder.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    const priorityEmbedOrder = [
      'models/gemini-embedding-001',
      'models/gemini-embedding-2',
      'models/gemini-embedding-2-preview',
    ];

    activeEmbeddingModels.sort((a, b) => {
      const idxA = priorityEmbedOrder.indexOf(a.key);
      const idxB = priorityEmbedOrder.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    return {
      embedding: activeEmbeddingModels,
      chat: activeChatModels,
    };
  }

  async getModelList(): Promise<ModelList> {
    const defaultModels = await this.getDefaultModels();
    const configProvider = getConfiguredModelProviderById(this.id);

    return {
      embedding: [
        ...defaultModels.embedding,
        ...(configProvider?.embeddingModels || []),
      ],
      chat: [...defaultModels.chat, ...(configProvider?.chatModels || [])],
    };
  }

  async loadChatModel(key: string): Promise<BaseLLM<any>> {
    // Remap retired models or legacy names to active working models
    if (
      !key ||
      key.includes('gemini-2.5-flash') ||
      key.includes('gemini-2.5-pro') ||
      key === 'gemini'
    ) {
      key = 'models/gemini-3.5-flash';
    }

    if (!key.startsWith('models/')) {
      key = `models/${key}`;
    }

    return new GeminiLLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    });
  }

  async loadEmbeddingModel(key: string): Promise<BaseEmbedding<any>> {
    // Remap retired models
    if (!key || key.includes('text-embedding-004') || key === 'default') {
      key = 'models/gemini-embedding-001';
    }

    if (!key.startsWith('models/')) {
      key = `models/${key}`;
    }

    return new GeminiEmbedding({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    });
  }

  static parseAndValidate(raw: any): GeminiConfig {
    if (!raw || typeof raw !== 'object')
      throw new Error('Invalid config provided. Expected object');
    if (!raw.apiKey)
      throw new Error('Invalid config provided. API key must be provided');

    return {
      apiKey: String(raw.apiKey),
    };
  }

  static getProviderConfigFields(): UIConfigField[] {
    return providerConfigFields;
  }

  static getProviderMetadata(): ProviderMetadata {
    return {
      key: 'gemini',
      name: 'Gemini',
    };
  }
}

export default GeminiProvider;
