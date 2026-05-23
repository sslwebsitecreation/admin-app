import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class YoutubeController extends Controller {
  @service api;

  @tracked isDeleting = false;

  @action
  async deleteVideo(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;

    this.isDeleting = true;
    try {
      await this.api.deleteYoutube(id);
      this.model.videos = this.model.videos.filter(v => v.id !== id);
    } catch (error) {
      alert('Failed to delete video: ' + error.message);
    } finally {
      this.isDeleting = false;
    }
  }
}