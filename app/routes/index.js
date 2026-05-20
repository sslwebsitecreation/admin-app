import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {

  @service data;

  async model() {

    try {

      // Track visitor
      fetch(
  'https://counterapi.dev/api/riyasrisilks/visits/up'
      ).catch(err => {
        console.error(
          'Visitor tracking failed',
          err
        );
      });

      // Existing API fetch
      const data =
        await this.data.fetchAll();

      return {

        products:
          data.products || [],

        youtube:
          data.youtube_videos || []
      };

    } catch (error) {

      return {

        products: [],

        youtube: [],

        error: error.message
      };
    }
  }
}