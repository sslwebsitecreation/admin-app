import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

const SYNC_KEY = 'sync-clicks';

export default class TopHeaderComponent extends Component {
  @service router;
  @service data;

  @tracked query = '';
  @tracked dailySyncLimit = 10;

  get canShowSync() {
    return this.getTodayClickCount(SYNC_KEY) < this.dailySyncLimit;
  }

  get todaySyncCount() {
    return this.getTodayClickCount(SYNC_KEY);
  }

  get remainingSyncCount() {
    return Math.max(0, this.dailySyncLimit - this.todaySyncCount);
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
  goHome() {
    this.router.transitionTo('index');
  }

  @action
  handleQueryInput(event) {
    this.query = event.target.value;
  }

  @action
  handleSearchKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.doSearch();
    }
  }

  @action
  handleSearchClick() {
    this.doSearch();
  }

  doSearch() {
    const q = this.query.trim();
    if (q) {
      this.router.transitionTo('products', { queryParams: { search: q } });
    }
  }

  @action
  async handleSync() {
    if (!this.canShowSync) {
      alert('Sync limit reached for today');
      return;
    }
    try {
      this.incrementClickCount(SYNC_KEY);
      await this.data.forceSync();
      window.location.reload();
    } catch (err) {
      alert('Sync failed: ' + err.message);
    }
  }
}
