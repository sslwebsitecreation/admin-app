import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

const CACHE_KEY = 'admin-data';

const DEFAULT_CACHE_EXPIRY_HOURS = 1;

export default class DataService extends Service {
  @service indexedDb;
  @service api;

  @tracked products = [];
  @tracked youtubeVideos = [];
  @tracked categoriesArray = [];
  @tracked tagsArray = [];
  @tracked isLoading = false;
  @tracked error = null;
  @tracked lastSynced = null;

  cacheExpiryHours = DEFAULT_CACHE_EXPIRY_HOURS;

  constructor() {
    super(...arguments);
    this.loadFromIndexedDB();
  }

  setCacheExpiry(hours) {
    this.cacheExpiryHours = hours;
  }

  isCacheExpired(cached) {
    if (!cached || !cached.lastSynced) return true;
    const expiryMs = this.cacheExpiryHours * 60 * 60 * 1000;
    const cachedTime = new Date(cached.lastSynced).getTime();
    return Date.now() - cachedTime > expiryMs;
  }

  async loadFromIndexedDB() {
    try {
      const cached = await this.indexedDb.get(CACHE_KEY);
      if (cached && !this.isCacheExpired(cached)) {
        this.products = cached.products || [];
        this.youtubeVideos = cached.youtubeVideos || [];
        this.categoriesArray = cached.categoriesArray || [];
        this.tagsArray = cached.tagsArray || [];
        this.lastSynced = cached.lastSynced || null;
      }
    } catch (e) {
      console.error('Failed to load from IndexedDB:', e);
    }
  }

  async saveToIndexedDB() {
    try {
      await this.indexedDb.set(CACHE_KEY, {
        products: this.products,
        youtubeVideos: this.youtubeVideos,
        categoriesArray: this.categoriesArray,
        tagsArray: this.tagsArray,
        lastSynced: this.lastSynced
      });
    } catch (e) {
      console.error('Failed to save to IndexedDB:', e);
    }
  }

  async fetchAll() {
    const cached = await this.indexedDb.get(CACHE_KEY);
    if (cached && cached.products && cached.products.length > 0 && !this.isCacheExpired(cached)) {
      this.products = cached.products;
      this.youtubeVideos = cached.youtubeVideos;
      this.categoriesArray = cached.categoriesArray || [];
      this.tagsArray = cached.tagsArray || [];
      this.lastSynced = cached.lastSynced;
      return {
        products: this.products,
        youtube_videos: this.youtubeVideos
      };
    }
    
    return this.syncAndFetch();
  }

  async syncAndFetch() {
    this.isLoading = true;
    this.error = null;

    try {
      try {
        await fetch('/api/v1/rebuild-cache', { method: 'POST' });
      } catch (e) {}
      
      const data = await this.api.getAll();
      
      this.products = data.products || [];
      this.youtubeVideos = data.youtube_videos || [];
      this.lastSynced = new Date().toISOString();

      this.extractCategoriesAndTags();
      
      await this.saveToIndexedDB();
      
      return { products: this.products, youtube_videos: this.youtubeVideos };
    } catch (err) {
      this.error = err.message;
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  async forceSync() {
    return this.syncAndFetch();
  }

  invalidate() {
    this.products = [];
    this.youtubeVideos = [];
    this.categoriesArray = [];
    this.tagsArray = [];
    this.lastSynced = null;
    this.indexedDb.delete(CACHE_KEY).catch(() => {});
  }

  extractCategoriesAndTags() {
    const cats = new Set();
    const tags = new Set();

    for (const p of this.products) {
      if (p.category) cats.add(p.category.trim());

      if (p.tags) {
        if (Array.isArray(p.tags)) {
          for (const t of p.tags) {
            if (t) tags.add(String(t).trim());
          }
        } else if (typeof p.tags === 'string' && p.tags) {
          for (const t of p.tags.split(',')) {
            const trimmed = t.trim();
            if (trimmed) tags.add(trimmed);
          }
        }
      }
    }

    this.categoriesArray = [...cats].sort();
    this.tagsArray = [...tags].sort();
  }

  getProducts() {
    return this.products;
  }

  getYoutubeVideos() {
    return this.youtubeVideos;
  }

  get lastSyncedAt() {
    return this.lastSynced;
  }
}