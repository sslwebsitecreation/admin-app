const YOUTUBE_EMBED_PREFIX = 'https://www.youtube.com/embed/';

export default class YoutubeVideo {
  id = null;
  link = '';
  title = '';
  description = '';
  product_ids = '';
  created_at = null;

  static fromJson(json) {
    const video = new YoutubeVideo();
    Object.assign(video, json);
    return video;
  }

  static extractVideoId(input) {
    if (!input) return null;

    const trimmed = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    try {
      const url = new URL(trimmed);
      if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
        return url.searchParams.get('v');
      }
    } catch {
      return null;
    }

    return null;
  }

  get productIdArray() {
    if (!this.product_ids) return [];
    try {
      return JSON.parse(this.product_ids);
    } catch {
      return [];
    }
  }

  get embedUrl() {
    if (!this.link) return null;
    return `${YOUTUBE_EMBED_PREFIX}${this.link}`;
  }

  get isValidVideoId() {
    return this.link && /^[a-zA-Z0-9_-]{11}$/.test(this.link);
  }
}