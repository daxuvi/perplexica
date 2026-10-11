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

export const searchDuckDuckGo = async (
  query: string,
): Promise<SearxngSearchResult[]> => {
  try {
    const params = new URLSearchParams({ q: query });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      body: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const html = await res.text();
    const blocks = html.split('web-result');
    const results: SearxngSearchResult[] = [];

    for (const b of blocks.slice(1)) {
      const linkMatch = b.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!linkMatch) continue;

      let url = linkMatch[1];
      if (url.includes('uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]+)/);
        if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
      }

      const title = linkMatch[2]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      const snipMatch = b.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      const content = snipMatch
        ? snipMatch[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&#x27;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim()
        : title;

      if (title && url && !url.includes('duckduckgo.com')) {
        results.push({
          title,
          url,
          content,
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('DuckDuckGo search error:', err);
    return [];
  }
};

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  const primaryURL = getSearxngURL();
  const instances = Array.from(
    new Set([primaryURL, 'https://etsi.me', 'https://search.lumy.live'].filter(Boolean)),
  );

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
      const timeoutId = setTimeout(() => controller.abort(), 3500);

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
    } catch {
      continue;
    }
  }

  // Fallback to DuckDuckGo if SearXNG instances fail, timeout, or return empty results
  const ddgResults = await searchDuckDuckGo(query);
  if (ddgResults.length > 0) {
    return { results: ddgResults, suggestions: [] };
  }

  return { results: [], suggestions: [] };
};
