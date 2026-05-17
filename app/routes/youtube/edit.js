import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class YoutubeEditRoute extends Route {
  @service api;

  async model(params) {
    const data = await this.api.getAll();
    const videos = data.youtube || [];
    return videos.find(v => v.id == params.id);
  }
}