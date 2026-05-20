import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ProductsIndexController extends Controller {
  @service api;

  @tracked isDeleting = false;

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