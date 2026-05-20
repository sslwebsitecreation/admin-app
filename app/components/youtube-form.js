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

      this.link =
        this.args.video.link || '';

      this.title =
        this.args.video.title || '';

      this.description =
        this.args.video.description || '';

      if (
        Array.isArray(
          this.args.video.product_ids
        )
      ) {

        this.productIds =
          this.args.video.product_ids.join(',');

      } else {

        this.productIds =
          this.args.video.product_ids || '';
      }

      this.rawInput =
        this.args.video.link || '';

      this.videoIdValid =
        this.link &&
        /^[a-zA-Z0-9_-]{11}$/.test(
          this.link
        );

      this.previewUrl =
        this.videoIdValid
          ? `https://www.youtube.com/embed/${this.link}`
          : null;
    }
  }

  get isValid() {

    return (
      this.title &&
      this.link &&
      this.videoIdValid
    );
  }

  get isEdit() {
    return !!this.args.video;
  }

  extractYoutubeId(url) {

    if (!url) {
      return null;
    }

    const patterns = [

      /(?:youtube\.com\/watch\?v=)([^&]+)/,

      /(?:youtu\.be\/)([^?&]+)/,

      /(?:youtube\.com\/live\/)([^?&]+)/,

      /(?:youtube\.com\/shorts\/)([^?&]+)/,

      /^[a-zA-Z0-9_-]{11}$/
    ];

    for (const pattern of patterns) {

      const match = url.match(pattern);

      if (match) {

        if (match[1]) {
          return match[1];
        }

        if (
          /^[a-zA-Z0-9_-]{11}$/.test(url)
        ) {
          return url;
        }
      }
    }

    return null;
  }

  @action
  handleLinkInput(event) {

    const input =
      event.target.value.trim();

    this.rawInput = input;

    const videoId =
      this.extractYoutubeId(input);

    if (videoId) {

      this.link = videoId;

      this.videoIdValid = true;

      this.previewUrl =
        `https://www.youtube.com/embed/${videoId}`;

      this.error = null;

    } else {

      this.link = '';

      this.videoIdValid = false;

      this.previewUrl = null;

      if (input.length > 0) {

        this.error =
          'Invalid YouTube URL';

      } else {

        this.error = null;
      }
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

    this.productIds =
      event.target.value;
  }

  @action
  goBack() {
    this.router.history.back();
  }

  @action
  async handleSubmit(event) {

    event.preventDefault();

    if (!this.isValid) {

      this.error =
        'Please enter valid YouTube details';

      return;
    }

    this.isSaving = true;

    this.error = null;

    try {

      const parsedProductIds =
        this.productIds

          ? this.productIds
              .replace(/\[/g, '')
              .replace(/\]/g, '')
              .split(',')
              .map(id => id.trim())
              .filter(
                id => id.length > 0
              )

          : [];

      const payload = {

        link: this.link,

        title: this.title,

        description:
          this.description,

        product_ids:
          JSON.stringify(
            parsedProductIds
          )
      };

      console.log(
        'Submitting Payload:',
        payload
      );

      let result;

      if (this.isEdit) {

        result =
          await this.api.updateYoutube({
            ...payload,
            id: this.args.video.id
          });

      } else {

        result =
          await this.api.createYoutube(
            payload
          );
      }

      console.log(
        'API Result:',
        result
      );

      if (
        result.success ||
        result.data?.success
      ) {

        try {

          await this.api.rebuildCache();

        } catch (cacheErr) {

          console.error(
            'Cache rebuild failed',
            cacheErr
          );
        }

        this.router.transitionTo(
          'youtube'
        );

      } else {

        this.error =
          result.error ||
          result.message ||
          JSON.stringify(result) ||
          'Failed to save video';
      }

    } catch (err) {

      console.error(err);

      this.error =
        err.message ||
        'Failed to save video';

    } finally {

      this.isSaving = false;
    }
  }
}