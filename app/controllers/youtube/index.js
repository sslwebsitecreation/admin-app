import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class YoutubeController extends Controller {
  @service api;
  @service data;

  @tracked isDeleting = false;

  @action
  async deleteVideo(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;

    this.isDeleting = true;
    try {
      await this.api.deleteYoutube(id);
      this.data.youtubeVideos = this.data.youtubeVideos.filter(v => v.id !== id);
      await this.data.saveToIndexedDB();
    } catch (error) {
      alert('Failed to delete video: ' + error.message);
    } finally {
      this.isDeleting = false;
    }
  }
}