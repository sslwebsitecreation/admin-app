import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ProductsIndexController extends Controller {
  @service api;

  queryParams = ['search'];

  @tracked search = '';
  @tracked isDeleting = false;

  get searchedProducts() {
    const products = this.model.products || [];
    if (!this.search) return products;
    const q = this.search.toLowerCase();
    return products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  @action
  clearSearch() {
    this.search = '';
  }

  @action
  async deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.isDeleting = true;
    try {
      await this.api.deleteProduct(id);
      this.model.products = this.model.products.filter(p => p.id !== id);
    } catch (error) {
      alert('Failed to delete product: ' + error.message);
    } finally {
      this.isDeleting = false;
    }
  }
}
