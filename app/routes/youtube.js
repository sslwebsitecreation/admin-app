import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class YoutubeRoute extends Route {
  @service data;

  async model() {
    try {
      const result = await this.data.fetchAll();
      return { videos: result.youtube_videos || [], error: null };
    } catch (error) {
      return { videos: [], error: error.message };
    }
  }
}