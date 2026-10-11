/**
 * Storage & State Manager for Perplexica Pro
 */

const STORAGE_KEYS = {
  API_KEY: 'perplexica_gemini_api_key',
  SETTINGS: 'perplexica_settings',
  THREADS: 'perplexica_threads',
  ACTIVE_THREAD: 'perplexica_active_thread_id'
};

const DEFAULT_SETTINGS = {
  model: 'gemini-flash-latest',
  temperature: 0.7,
  enableGrounding: true,
  theme: 'dark'
};

export const Storage = {
  getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  },

  setApiKey(key) {
    if (key) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  },

  getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  getThreads() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.THREADS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getThread(id) {
    const threads = this.getThreads();
    return threads.find(t => t.id === id) || null;
  },

  saveThread(thread) {
    const threads = this.getThreads();
    const idx = threads.findIndex(t => t.id === thread.id);
    if (idx >= 0) {
      threads[idx] = thread;
    } else {
      threads.unshift(thread);
    }
    localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
    return thread;
  },

  deleteThread(id) {
    let threads = this.getThreads();
    threads = threads.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
    if (this.getActiveThreadId() === id) {
      this.setActiveThreadId(null);
    }
    return threads;
  },

  clearAllThreads() {
    localStorage.removeItem(STORAGE_KEYS.THREADS);
    this.setActiveThreadId(null);
  },

  getActiveThreadId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_THREAD) || null;
  },

  setActiveThreadId(id) {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_THREAD, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_THREAD);
    }
  }
};
