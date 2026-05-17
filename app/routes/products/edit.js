import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ProductsEditRoute extends Route {
  @service data;

  async model(params) {
    const result = await this.data.fetchAll();
    const products = result.products || [];
    return products.find(p => p.id == params.id);
  }
}