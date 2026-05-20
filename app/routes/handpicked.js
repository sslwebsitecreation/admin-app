import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class HandpickedRoute extends Route {
  @service data;
  @service handpicked;

  async model() {
    try {
      const result = await this.data.fetchAll();
      const allProducts = result.products || [];
      const hpProducts = this.handpicked.getHandpickedProducts(allProducts);
      return {
        products: allProducts,
        handpicked: hpProducts,
        error: null,
      };
    } catch (error) {
      return { products: [], handpicked: [], error: error.message };
    }
  }
}
