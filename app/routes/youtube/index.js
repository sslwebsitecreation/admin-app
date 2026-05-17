import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class YoutubeIndexRoute extends Route {
  @service api;

  async model() {
    try {
      const data = await this.api.getAll();
      return { videos: data.youtube_videos || [], error: null };
    } catch (error) {
      return { videos: [], error: error.message };
    }
  }
}