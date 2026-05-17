import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ProductsRoute extends Route {
  @service api;

  async model() {
    try {
      const data = await this.api.getAll();
      return { products: data.products || [], error: null };
    } catch (error) {
      return { products: [], error: error.message };
    }
  }
}