import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import YoutubeVideo from 'admin-app/models/youtube-video';

export default class YoutubeFormComponent extends Component {
  @service api;
  @service router;
  @service data;

  @tracked link = '';
  @tracked title = '';
  @tracked description = '';
  @tracked selectedProductIds = [];

  @tracked isSaving = false;
  @tracked error = null;
  @tracked previewUrl = null;
  @tracked videoIdValid = false;
  @tracked rawInput = '';

  @tracked showProductModal = false;
  @tracked productSearchInput = '';
  @tracked productSearch = '';

  constructor() {
    super(...arguments);
    if (this.args.video) {
      const v = this.args.video;
      this.link = v.link || '';
      this.title = v.title || '';
      this.description = v.description || '';
      this.rawInput = v.link || '';
      this.videoIdValid = this.link && /^[a-zA-Z0-9_-]{11}$/.test(this.link);
      this.previewUrl = this.videoIdValid ? `https://www.youtube.com/embed/${this.link}` : null;

      this.loadSelectedIds(v.product_ids);
    }
  }

  loadSelectedIds(idString) {
    if (!idString) return;
    let idsArray = idString.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (idsArray.length) {
      this.selectedProductIds = idsArray;
      return;
    }
    this.selectedProductIds = [];
  }

  get filteredProducts() {
    const q = (this.productSearch || '').toLowerCase();
    let items = this.data.products || [];
    if (q) {
      items = items.filter(p => (p.name || '').toLowerCase().includes(q));
    }
    return items.map(p => ({ ...p, isSelected: this.selectedProductIds.includes(p.id) }));
  }

  get selectedProducts() {
    return (this.data.products || []).filter(p => this.selectedProductIds.includes(p.id));
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

  @action handleTitleInput(event) { this.title = event.target.value; }
  @action handleDescriptionInput(event) { this.description = event.target.value; }
  @action handleProductSearchInput(event) { this.productSearchInput = event.target.value; }

  @action handleProductSearchKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.applyProductSearch();
    }
  }

  @action applyProductSearch() {
    this.productSearch = this.productSearchInput;
  }

  @action openProductModal() {
    this.productSearchInput = '';
    this.productSearch = '';
    this.showProductModal = true;
  }

  @action closeProductModal() {
    this.showProductModal = false;
    this.productSearchInput = '';
    this.productSearch = '';
  }

  @action stopPropagation(e) { e.stopPropagation(); }

  @action toggleProduct(product) {
    if (this.selectedProductIds.includes(product.id)) {
      this.selectedProductIds = this.selectedProductIds.filter(id => id !== product.id);
    } else {
      this.selectedProductIds = [...this.selectedProductIds, product.id];
    }
  }

  @action goBack() {
    this.router.transitionTo('youtube');
  }

  @action clearSelection() {
    this.selectedProductIds = [];
  }

  @action async handleSubmit(event) {
    event.preventDefault();
    if (!this.isValid) {
      this.error = 'Please fill title and a valid YouTube URL';
      return;
    }
    this.isSaving = true;
    this.error = null;
    let productIdsString = this.selectedProductIds.length ? this.selectedProductIds.join(',') : '';
    try {
      const payload = {
        link: this.link,
        title: this.title,
        description: this.description,
        product_ids: productIdsString,
      };
      let result;
      if (this.isEdit) {
        result = await this.api.updateYoutube({ ...payload, id: this.args.video.id });
      } else {
        result = await this.api.createYoutube(payload);
      }
      if (result.success) {
        if (this.isEdit) {
          this.data.youtubeVideos = this.data.youtubeVideos.map(v =>
            v.id === this.args.video.id ? { ...v, ...payload } : v
          );
        } else {
          this.data.youtubeVideos = [...this.data.youtubeVideos, {
            id: result.data?.video_id || Date.now(),
            ...payload,
            created_at: new Date().toISOString(),
          }];
        }
        await this.data.saveToIndexedDB();
        this.router.transitionTo('youtube');
      } else {
        this.error = result.message || 'Failed to save video';
      }
    } catch (err) {
      this.error = err.message || 'Failed to save video';
    } finally {
      this.isSaving = false;
    }
  }
}
