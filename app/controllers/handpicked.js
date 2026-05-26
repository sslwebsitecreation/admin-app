import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default class HandpickedController extends Controller {
  @service data;
  @service handpicked;

  get handpickedProducts() {
    return this.handpicked.getHandpickedProducts(this.data.products || []);
  }
}
