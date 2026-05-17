import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ProductsEditRoute extends Route {
  @service api;

  async model(params) {
    const data = await this.api.getAll();
    const products = data.products || [];
    return products.find(p => p.id == params.id);
  }
}