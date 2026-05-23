import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

const STORAGE_KEY = 'handpicked-list';

export default class HandpickedService extends Service {
  @service indexedDb;

  @tracked items = [];
  @tracked isLoading = false;

  constructor() {
    super(...arguments);
    this.load();
  }

  async load() {
    this.isLoading = true;
    try {
      const data = await this.indexedDb.get(STORAGE_KEY);
      this.items = (data && data.ids) || [];
    } catch {
      this.items = [];
    } finally {
      this.isLoading = false;
    }
  }

  async save() {
    await this.indexedDb.set(STORAGE_KEY, { ids: this.items });
  }

  isHandpicked(productId) {
    return this.items.includes(productId);
  }

  get count() {
    return this.items.length;
  }

  get maxed() {
    return this.items.length >= 5;
  }

  get orderedIds() {
    return [...this.items];
  }

  getHandpickedProducts(allProducts) {
    const map = {};
    allProducts.forEach(p => { map[p.id] = p; });
    return this.items.map(id => map[id]).filter(Boolean);
  }

  async updateList(newIds, dataService) {
    this.items = newIds;
    await this.save();
    this._writeToDataService(dataService);
  }

  _writeToDataService(dataService) {
    const allProducts = dataService.products || [];

    allProducts.forEach(p => {
      const idx = this.items.indexOf(p.id);
      if (idx !== -1) {
        p.handpicked = true;
        p.handpicked_order = idx + 1;
      } else {
        p.handpicked = false;
        p.handpicked_order = 0;
      }
    });

    dataService.saveToIndexedDB();
    dataService.products = [...allProducts];
  }
}
