import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ProductsRoute extends Route {
  @service data;

  async model() {
    try {
      const result = await this.data.fetchAll();
      return { products: result.products || [], error: null };
    } catch (error) {
      return { products: [], error: error.message };
    }
  }
}