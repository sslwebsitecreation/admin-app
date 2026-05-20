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

  async setFromProducts(products) {
    this.items = products
      .filter(p => p.handpicked)
      .sort((a, b) => (a.handpicked_order || 0) - (b.handpicked_order || 0))
      .map(p => p.id);
    await this.save();
  }

  async add(productId) {
    if (this.items.length >= 5) return false;
    if (this.items.includes(productId)) return false;
    this.items = [...this.items, productId];
    await this.save();
    return true;
  }

  async remove(productId) {
    this.items = this.items.filter(id => id !== productId);
    await this.save();
  }

  async reorder(orderedIds) {
    this.items = orderedIds;
    await this.save();
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
}
