import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import YoutubeVideo from 'admin-app/models/youtube-video';

export default class YoutubeFormComponent extends Component {
  @service api;
  @service router;

  @tracked link = '';
  @tracked title = '';
  @tracked description = '';
  @tracked productIds = '';

  @tracked isSaving = false;
  @tracked error = null;
  @tracked previewUrl = null;
  @tracked videoIdValid = false;
  @tracked rawInput = '';

  constructor() {
    super(...arguments);
    if (this.args.video) {
      this.link = this.args.video.link || '';
      this.title = this.args.video.title || '';
      this.description = this.args.video.description || '';
      this.productIds = this.args.video.product_ids || '';
      this.rawInput = this.args.video.link || '';
      this.videoIdValid = this.link && /^[a-zA-Z0-9_-]{11}$/.test(this.link);
      this.previewUrl = this.videoIdValid ? `https://www.youtube.com/embed/${this.link}` : null;
    }
  }

  get isValid() {
    return this.title && this.link && this.videoIdValid;
  }

  get isEdit() {
    return !!this.args.video;
  }

  @action
  handleLinkInput(event) {
    const input = event.target.value;
    this.rawInput = input;

    const videoId = YoutubeVideo.extractVideoId(input);
    if (videoId) {
      this.link = videoId;
      this.videoIdValid = true;
      this.previewUrl = `https://www.youtube.com/embed/${videoId}`;
      this.error = null;
    } else {
      this.link = input;
      this.videoIdValid = false;
      this.previewUrl = null;
    }
  }

  @action
  handleTitleInput(event) {
    this.title = event.target.value;
  }

  @action
  handleDescriptionInput(event) {
    this.description = event.target.value;
  }

  @action
  handleProductIdsInput(event) {
    const value = event.target.value;
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      this.productIds = trimmed;
    } else if (trimmed) {
      const ids = trimmed.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      this.productIds = JSON.stringify(ids);
    } else {
      this.productIds = '';
    }
  }

  @action
  goBack() {
    this.router.history.back();
  }

  @action
  async handleSubmit(event) {
    event.preventDefault();

    if (!this.isValid) {
      this.error = 'Please fill title and a valid YouTube URL';
      return;
    }

    this.isSaving = true;
    this.error = null;

    try {
      if (this.isEdit) {
        this.router.transitionTo('youtube');
      } else {
        const result = await this.api.createYoutube({
          link: this.link,
          title: this.title,
          description: this.description,
          product_ids: this.productIds,
        });

        if (result.success) {
          this.router.transitionTo('youtube');
        } else {
          this.error = result.message || 'Failed to create video';
        }
      }
    } catch (err) {
      this.error = err.message || 'Failed to save video';
    } finally {
      this.isSaving = false;
    }
  }
}