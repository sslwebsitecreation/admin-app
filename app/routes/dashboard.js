import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class DashboardRoute extends Route {

  @service data;

  async model() {

    try {

      const response =
        await fetch(
          'https://counterapi.dev/api/riyasrisilks/visits'
        );

      const visitorData =
        await response.json();

      const data =
        await this.data.fetchAll();

      console.log(
        'VISITOR DATA',
        visitorData
      );

      return {

        products:
          data.products?.length || 0,

        youtube:
          data.youtube_videos?.length || 0,

        visitors:
          visitorData.count || 0
      };

    } catch (error) {

      console.error(error);

      return {

        products: 0,

        youtube: 0,

        visitors: 0
      };
    }
  }
}