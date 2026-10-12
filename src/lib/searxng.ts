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
    const timeoutId = setTimeout(() => controller.abort(), 2500);

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

  // 1. If user configured a dedicated local/private SearXNG instance (not the default public ones), try it first
  if (
    primaryURL &&
    !primaryURL.includes('etsi.me') &&
    !primaryURL.includes('search.lumy.live')
  ) {
    try {
      const cleanBase = primaryURL.endsWith('/') ? primaryURL.slice(0, -1) : primaryURL;
      const url = new URL(`${cleanBase}/search?format=json`);
      url.searchParams.append('q', query);

      if (opts) {
        Object.keys(opts).forEach((key) => {
          const value = opts[key as keyof SearxngSearchOptions];
          if (Array.isArray(value)) {
            url.searchParams.append(key, value.join(','));
          } else if (value !== undefined) {
            url.searchParams.append(key, value as string);
          }
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const results: SearxngSearchResult[] = data.results || [];
        const suggestions: string[] = data.suggestions || [];
        if (results.length > 0) {
          return { results, suggestions };
        }
      }
    } catch {
      // Continue to fast search
    }
  }

  // 2. Fast DuckDuckGo search (sub-second retrieval, bypasses broken public SearXNG rate-limits)
  const ddgResults = await searchDuckDuckGo(query);
  if (ddgResults.length > 0) {
    return { results: ddgResults, suggestions: [] };
  }

  // 3. Fallback: try public SearXNG instances with short timeout
  const publicInstances = ['https://etsi.me', 'https://search.lumy.live'];
  for (const baseURL of publicInstances) {
    try {
      const url = new URL(`${baseURL}/search?format=json`);
      url.searchParams.append('q', query);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const results: SearxngSearchResult[] = data.results || [];
        const suggestions: string[] = data.suggestions || [];
        if (results.length > 0) {
          return { results, suggestions };
        }
      }
    } catch {
      continue;
    }
  }

  return { results: [], suggestions: [] };
};
