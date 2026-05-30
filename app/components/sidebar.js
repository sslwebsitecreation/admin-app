import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const CLEAR_CACHE_KEY = 'clear-cache-clicks';

export default class SidebarComponent extends Component {
  @service router;
  @service data;
  @service indexedDb;

  @tracked dailyClearLimit = 20;

  get isDashboard() {
    return this.router.currentRouteName === 'index';
  }

  get isProducts() {
    return this.router.currentRouteName.startsWith('products');
  }

  get isYoutube() {
    return this.router.currentRouteName.startsWith('youtube');
  }

  get isHandpicked() {
    return this.router.currentRouteName === 'handpicked';
  }

  get isUtilities() {
    return this.router.currentRouteName.startsWith('utilities');
  }

  get canShowClearCache() {
    return this.getTodayClickCount(CLEAR_CACHE_KEY) < this.dailyClearLimit;
  }

  get todayClearCount() {
    return this.getTodayClickCount(CLEAR_CACHE_KEY);
  }

  get remainingClearCount() {
    return Math.max(0, this.dailyClearLimit - this.todayClearCount);
  }

  getTodayClickCount(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      const today = new Date().toDateString();
      if (data.date === today) {
        return data.count || 0;
      }
    } catch (e) {
      // ignore
    }
    return 0;
  }

  incrementClickCount(key) {
    try {
      const today = new Date().toDateString();
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (data.date !== today) {
        data.date = today;
        data.count = 0;
      }
      data.count = (data.count || 0) + 1;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  @action
  async handleClearCache() {
    if (!this.canShowClearCache) {
      alert('Clear cache limit reached for today');
      return;
    }
    if (!confirm('Clear all cached data and load fresh from server?')) return;

    try {
      this.incrementClickCount(CLEAR_CACHE_KEY);
      await this.indexedDb.delete('admin-data');
      await this.data.forceSync();
      window.location.reload();
    } catch (err) {
      alert('Clear cache failed: ' + err.message);
    }
  }

  @action
  handleLogout() {
    window.location.href = '/cdn-cgi/access/logout';
  }
}
