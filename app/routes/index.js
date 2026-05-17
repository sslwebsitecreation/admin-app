import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {
  @service api;

  async model() {
    try {
      const data = await this.api.getAll();
      return {
        products: data.products || [],
        youtube: data.youtube_videos || [],
      };
    } catch (error) {
      return { products: [], youtube: [], error: error.message };
    }
  }
}