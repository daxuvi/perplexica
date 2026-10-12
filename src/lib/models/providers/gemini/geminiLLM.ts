import OpenAILLM from '../openai/openaiLLM';
import {
  GenerateObjectInput,
  GenerateTextInput,
  GenerateTextOutput,
  StreamTextOutput,
} from '../../types';

const FALLBACK_MODELS = [
  'models/gemini-flash-lite-latest',
  'models/gemini-3.1-flash-lite',
  'models/gemini-3.5-flash',
];

class GeminiLLM extends OpenAILLM {
  private isQuotaOrUnavailableError(err: any): boolean {
    const msg = (err?.message || '').toLowerCase();
    const status = err?.status || err?.statusCode || err?.code;
    return (
      status === 429 ||
      status === 503 ||
      status === 404 ||
      msg.includes('quota exceeded') ||
      msg.includes('resource_exhausted') ||
      msg.includes('high demand') ||
      msg.includes('unavailable') ||
      msg.includes('no longer available')
    );
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    try {
      return await super.generateText(input);
    } catch (err: any) {
      if (this.isQuotaOrUnavailableError(err)) {
        for (const fallback of FALLBACK_MODELS) {
          if (fallback === this.config.model) continue;
          try {
            console.warn(
              `[GeminiLLM] Model ${this.config.model} unavailable/limited, falling back to ${fallback}`,
            );
            const prevModel = this.config.model;
            this.config.model = fallback;
            const res = await super.generateText(input);
            this.config.model = prevModel;
            return res;
          } catch {
            continue;
          }
        }
      }
      throw err;
    }
  }

  async *streamText(
    input: GenerateTextInput,
  ): AsyncGenerator<StreamTextOutput> {
    try {
      yield* super.streamText(input);
      return;
    } catch (err: any) {
      if (this.isQuotaOrUnavailableError(err)) {
        for (const fallback of FALLBACK_MODELS) {
          if (fallback === this.config.model) continue;
          try {
            console.warn(
              `[GeminiLLM] Model ${this.config.model} stream limit, falling back to ${fallback}`,
            );
            const prevModel = this.config.model;
            this.config.model = fallback;
            yield* super.streamText(input);
            this.config.model = prevModel;
            return;
          } catch {
            continue;
          }
        }
      }
      throw err;
    }
  }

  async generateObject<T>(input: GenerateObjectInput): Promise<T> {
    try {
      return await super.generateObject<T>(input);
    } catch (err: any) {
      if (this.isQuotaOrUnavailableError(err)) {
        for (const fallback of FALLBACK_MODELS) {
          if (fallback === this.config.model) continue;
          try {
            console.warn(
              `[GeminiLLM] Model ${this.config.model} object parsing limit, falling back to ${fallback}`,
            );
            const prevModel = this.config.model;
            this.config.model = fallback;
            const res = await super.generateObject<T>(input);
            this.config.model = prevModel;
            return res;
          } catch {
            continue;
          }
        }
      }
      throw err;
    }
  }
}

export default GeminiLLM;
