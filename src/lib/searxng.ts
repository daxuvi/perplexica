import { getSearxngURL } from './config/serverRegistry';

export interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
}

interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
}

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  const primaryURL = getSearxngURL();
  const instances = Array.from(
    new Set([primaryURL, 'https://etsi.me', 'https://search.lumy.live'].filter(Boolean)),
  );

  let lastError: any = null;

  for (const baseURL of instances) {
    try {
      const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
      const url = new URL(`${cleanBase}/search?format=json`);
      url.searchParams.append('q', query);

      if (opts) {
        Object.keys(opts).forEach((key) => {
          const value = opts[key as keyof SearxngSearchOptions];
          if (Array.isArray(value)) {
            url.searchParams.append(key, value.join(','));
            return;
          }
          if (value !== undefined) {
            url.searchParams.append(key, value as string);
          }
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`SearXNG error from ${cleanBase}: ${res.statusText}`);
      }

      const data = await res.json();
      const results: SearxngSearchResult[] = data.results || [];
      const suggestions: string[] = data.suggestions || [];

      if (results.length > 0) {
        return { results, suggestions };
      }
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  console.warn('All SearXNG instances failed or empty:', lastError?.message);
  return { results: [], suggestions: [] };
};
