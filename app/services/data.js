import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

const CACHE_KEY = 'admin-data';

const DEFAULT_CACHE_EXPIRY_HOURS = 1;

export default class DataService extends Service {
  @service indexedDb;

  @tracked products = [];
  @tracked youtubeVideos = [];
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
      
      const response = await fetch('/api/v1/all');
      const data = await response.json();
      
      this.products = data.products || [];
      this.youtubeVideos = data.youtube_videos || [];
      this.lastSynced = new Date().toISOString();
      
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
    this.lastSynced = null;
    this.indexedDb.delete(CACHE_KEY).catch(() => {});
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