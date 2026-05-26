import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class YoutubeEditRoute extends Route {
  @service data;

  async model(params) {
    const result = await this.data.fetchAll();
    const videos = result.youtube_videos || [];
    return videos.find(v => v.id == params.id);
  }
}