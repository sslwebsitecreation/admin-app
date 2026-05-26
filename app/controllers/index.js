import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const CLEAR_CACHE_KEY = 'clear-cache-clicks';
const SYNC_KEY = 'sync-clicks';

export default class IndexController extends Controller {
  @service data;
  @service indexedDb;

  @tracked dailyClearLimit = 20;
  @tracked dailySyncLimit = 10;

  get canShowClearCache() {
    return this.getTodayClickCount(CLEAR_CACHE_KEY) < this.dailyClearLimit;
  }

  get canShowSync() {
    return this.getTodayClickCount(SYNC_KEY) < this.dailySyncLimit;
  }

  get todaySyncCount() {
    return this.getTodayClickCount(SYNC_KEY);
  }

  get todayClearCount() {
    return this.getTodayClickCount(CLEAR_CACHE_KEY);
  }

  get remainingSyncCount() {
    return Math.max(0, this.dailySyncLimit - this.todaySyncCount);
  }

  get remainingClearCount() {
    return Math.max(0, this.dailyClearLimit - this.todayClearCount);
  }

  getTodayClickCount(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      const today = new Date().toDateString();
      if (data.date === today) return data.count || 0;
    } catch (e) {}
    return 0;
  }

  incrementClickCount(key) {
    try {
      const today = new Date().toDateString();
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (data.date !== today) { data.date = today; data.count = 0; }
      data.count = (data.count || 0) + 1;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  @action
  async handleSync() {
    if (!this.canShowSync) { alert('Sync limit reached for today'); return; }
    this.incrementClickCount(SYNC_KEY);
    try {
      await this.data.forceSync();
      window.location.reload();
    } catch (err) { alert('Sync failed: ' + err.message); }
  }

  @action
  async handleClearCache() {
    if (!this.canShowClearCache) { alert('Clear cache limit reached for today'); return; }
    if (!confirm('Clear all cached data and load fresh from server?')) return;
    this.incrementClickCount(CLEAR_CACHE_KEY);
    try {
      await this.indexedDb.delete('admin-data');
      await this.data.forceSync();
      window.location.reload();
    } catch (err) { alert('Clear cache failed: ' + err.message); }
  }

  @action
  handleLogout() {
    window.location.href = '/cdn-cgi/access/logout';
  }
}
