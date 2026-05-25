import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ProductsController extends Controller {
  @service api;
  @service data;

  @tracked isDeleting = false;

  @action
  async deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.isDeleting = true;
    try {
      await this.api.deleteProduct(id);
      this.data.products = this.data.products.filter(p => p.id !== id);
      this.data.extractCategoriesAndTags();
      await this.data.saveToIndexedDB();
    } catch (error) {
      alert('Failed to delete product: ' + error.message);
    } finally {
      this.isDeleting = false;
    }
  }
}