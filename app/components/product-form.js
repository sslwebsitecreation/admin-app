import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const CATEGORIES = [
  'Soft Silk',
  'Bridal Collection',
  'Wedding Wear',
  'Banarasi',
  'Cotton Sarees',
  'Kanchipuram',
  'Organza',
  'Georgette',
  'Chiffon',
  'Silk Cotton',
  'Designer Wear',
  'Daily Wear',
];

const TAG_SUGGESTIONS = [
  'Wedding',
  'Traditional',
  'Trending',
  'Handloom',
  'Premium',
  'Festival',
  'Bridal',
  'Casual',
  'Party Wear',
  'Exclusive',
];

export default class ProductFormComponent extends Component {
  @service api;
  @service router;

  @tracked name = '';
  @tracked category = '';
  @tracked originalPrice = '';
  @tracked discountedPrice = '';
  @tracked stockCount = '';
  @tracked description = '';
  @tracked images = [];
  @tracked tags = [];
  @tracked tagInput = '';
  @tracked showCategorySuggestions = false;
  @tracked showTagSuggestions = false;
  @tracked isSaving = false;
  @tracked error = null;
  @tracked targetImageIndex = -1;
  @tracked modalData = null;

  constructor() {
    super(...arguments);
    if (this.args.product) {
      const p = this.args.product;
      this.name = p.name || '';
      this.category = p.category || '';
      this.originalPrice = p.original_price?.toString() || '';
      this.discountedPrice = p.discounted_price?.toString() || '';
      this.stockCount = p.stock_count?.toString() || '';
      this.description = p.description || '';
      this.tags = p.tags ? [...p.tags] : [];
      if (p.images) {
        this.images = p.images.map(img => ({
          ...img,
          colorName: img.color_name || '',
          preview: img.key,
          status: 'uploaded',
          file: null,
          showActions: true,
          isConverting: false,
          isUploading: false,
          isFailed: false,
          colorError: '',
          colorInput: img.color || '',
        }));
      }
    } else {
      this.images = [this.emptyRow()];
    }
  }

  emptyRow() {
    return { color: '', colorInput: '', colorName: '', key: null, file: null, preview: null, status: null, showActions: true, isConverting: false, isUploading: false, isFailed: false, colorError: '' };
  }

  get isEdit() { return !!this.args.product; }
  get canRemoveImages() { return this.images.length > 1; }
  get isInvalid() { return !this.isValid; }

  get isValid() {
    if (!this.name || !this.category || !this.originalPrice || !this.stockCount) return false;
    if (this.images.length === 0) return false;
    return this.images.every(img => img.status === 'uploaded' && img.key && img.color);
  }

  get filteredCategories() {
    const q = (this.category || '').toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(c => c.toLowerCase().includes(q));
  }

  get filteredTags() {
    const q = (this.tagInput || '').toLowerCase();
    const existing = new Set(this.tags.map(t => t.toLowerCase()));
    if (!q) return TAG_SUGGESTIONS.filter(t => !existing.has(t.toLowerCase()));
    return TAG_SUGGESTIONS.filter(t => t.toLowerCase().includes(q) && !existing.has(t.toLowerCase()));
  }

  // --- helpers ---
  withStatus(img, status) {
    return { ...img, status, showActions: !(status === 'converting' || status === 'uploading'), isConverting: status === 'converting', isUploading: status === 'uploading', isFailed: status === 'failed' };
  }

  isValidHex(str) {
    return /^#[0-9A-Fa-f]{6}$/.test(str);
  }

  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  canvasToBlob(canvas, quality) {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
    });
  }

  async convertToWebP(file) {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    let quality = 0.85;
    let blob = await this.canvasToBlob(canvas, quality);

    const targetBytes = 400 * 1024;
    while (blob.size > targetBytes && quality > 0.08) {
      quality = Math.max(quality - 0.08, 0.08);
      blob = await this.canvasToBlob(canvas, quality);
    }

    return {
      blob,
      originalSize: file.size,
      convertedSize: blob.size,
      originalType: file.type,
      width: img.width,
      height: img.height,
    };
  }

  // --- simple field actions ---
  @action updateName(e) { this.name = e.target.value; }
  @action updateCategory(e) { this.category = e.target.value; this.showCategorySuggestions = true; }
  @action updatePrice(e) { this.originalPrice = e.target.value; }
  @action updateDiscountedPrice(e) { this.discountedPrice = e.target.value; }
  @action updateStock(e) { this.stockCount = e.target.value; }
  @action updateDesc(e) { this.description = e.target.value; }

  // --- category autocomplete ---
  @action handleCategoryInput(e) {
    this.category = e.currentTarget.value;
    this.showCategorySuggestions = true;
  }

  @action handleCategoryFocus() {
    this.showCategorySuggestions = true;
  }

  @action handleCategoryBlur() {
    setTimeout(() => { this.showCategorySuggestions = false; }, 150);
  }

  @action selectCategory(cat) {
    this.category = cat;
    this.showCategorySuggestions = false;
  }

  // --- tags ---
  @action handleTagInput(e) {
    this.tagInput = e.currentTarget.value;
    this.showTagSuggestions = true;
  }

  @action handleTagKeydown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = (this.tagInput || '').trim();
      if (val && !this.tags.includes(val)) {
        this.tags = [...this.tags, val];
      }
      this.tagInput = '';
      this.showTagSuggestions = false;
    }
    if (e.key === 'Backspace' && !this.tagInput && this.tags.length) {
      this.tags = this.tags.slice(0, -1);
    }
  }

  @action handleTagBlur() {
    setTimeout(() => { this.showTagSuggestions = false; }, 150);
    const val = (this.tagInput || '').trim();
    if (val && !this.tags.includes(val)) {
      this.tags = [...this.tags, val];
    }
    this.tagInput = '';
  }

  @action addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags = [...this.tags, tag];
    }
    this.tagInput = '';
    this.showTagSuggestions = false;
  }

  @action removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  @action focusTagInput(e) {
    const input = e.currentTarget.querySelector('.pc-tag-input');
    if (input) input.focus();
  }

  // --- images / variants ---
  @action addImage() {
    this.images = [...this.images, this.emptyRow()];
  }

  @action removeImage(e) {
    const idx = parseInt(e.currentTarget.dataset.removeIndex, 10);
    this.images = this.images.filter((_, i) => i !== idx);
  }

  @action chooseVariantImage(idx) {
    this.targetImageIndex = idx;
    document.getElementById('file-input').click();
  }

  @action removeVariantImage(idx, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    this.images = this.images.map((img, i) => i === idx ? this.emptyRow() : img);
  }

  @action handleColorPicked(e) {
    const idx = parseInt(e.currentTarget.dataset.colorIndex, 10);
    const val = e.currentTarget.value;
    this.images = this.images.map((img, i) => i === idx ? { ...img, color: val, colorInput: val, colorError: '' } : img);
  }

  @action handleColorInput(e) {
    const idx = parseInt(e.currentTarget.dataset.colorIndex, 10);
    this.images = this.images.map((img, i) => i === idx ? { ...img, colorInput: e.currentTarget.value, colorError: '' } : img);
  }

  @action handleColorBlur(e) {
    const idx = parseInt(e.currentTarget.dataset.colorIndex, 10);
    const val = (e.currentTarget.value || '').trim();
    if (!val) {
      this.images = this.images.map((im, i) => i === idx ? { ...im, color: '', colorInput: '', colorError: '' } : im);
      return;
    }
    if (!this.isValidHex(val)) {
      this.images = this.images.map((im, i) => i === idx ? { ...im, colorError: `Invalid hex color: ${val}` } : im);
      return;
    }
    this.images = this.images.map((im, i) => i === idx ? { ...im, color: val, colorInput: val, colorError: '' } : im);
  }

  @action handleColorNameInput(e) {
    const idx = parseInt(e.currentTarget.dataset.colorNameIndex, 10);
    const colorName = e.currentTarget.value;
    this.images = this.images.map((img, i) => i === idx ? { ...img, colorName } : img);
  }

  @action async filePicked(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      this.error = 'Please select a valid image file';
      return;
    }

    const idx = this.targetImageIndex >= 0 ? this.targetImageIndex : this.images.length - 1;
    const previewUrl = URL.createObjectURL(file);

    this.images = this.images.map((img, i) =>
      i === idx ? { ...img, preview: previewUrl, ...this.withStatus(img, 'converting') } : img
    );
    this.error = null;

    try {
      const result = await this.convertToWebP(file);

      const os = result.originalSize;
      const cs = result.convertedSize;
      const cr = os && cs ? ((os - cs) / os * 100).toFixed(1) : '';
      const fmt = (b) => { if (!b) return ''; if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; };

      this.modalData = {
        targetIndex: idx,
        convertedPreviewUrl: URL.createObjectURL(result.blob),
        originalPreviewUrl: previewUrl,
        originalSizeFormatted: fmt(os),
        convertedSizeFormatted: fmt(cs),
        compressionFormatted: cr,
        originalSize: os,
        convertedSize: cs,
        originalType: result.originalType,
        width: result.width,
        height: result.height,
        webpBlob: result.blob,
      };
    } catch (err) {
      this.images = this.images.map((img, i) =>
        i === idx ? { ...img, ...this.withStatus(img, 'failed') } : img
      );
      this.error = err.message || 'Image conversion failed';
    }
  }

  @action async acceptImage() {
    if (!this.modalData) return;
    const { targetIndex, webpBlob, convertedPreviewUrl } = this.modalData;

    const webpFile = new File([webpBlob], 'image.webp', { type: 'image/webp' });

    this.images = this.images.map((img, i) =>
      i === targetIndex ? { ...img, ...this.withStatus(img, 'uploading') } : img
    );

    try {
      const result = await this.api.uploadImage(webpFile, 1200, 1600);
      const status = result.data?.key ? 'uploaded' : 'failed';
      this.images = this.images.map((img, i) =>
        i === targetIndex
          ? { ...img, key: result.data?.key || '', preview: convertedPreviewUrl, ...this.withStatus(img, status) }
          : img
      );
    } catch (err) {
      this.images = this.images.map((img, i) =>
        i === targetIndex ? { ...img, ...this.withStatus(img, 'failed') } : img
      );
    }

    this.modalData = null;
    this.error = null;
  }

  @action cancelImage() {
    if (!this.modalData) return;
    const idx = this.modalData.targetIndex;
    this.images = this.images.map((img, i) =>
      i === idx ? this.emptyRow() : img
    );
    this.modalData = null;
    this.error = null;
  }

  @action stopPropagation(e) { e.stopPropagation(); }

  @action goBack() { this.router.transitionTo('products'); }

  @action async handleSubmit(e) {
    e.preventDefault();
    if (!this.isValid) { this.error = 'Complete all images first'; return; }
    this.isSaving = true;
    try {
      const payload = {
        name: this.name,
        category: this.category,
        tags: this.tags,
        original_price: parseFloat(this.originalPrice),
        discounted_price: this.discountedPrice ? parseFloat(this.discountedPrice) : null,
        stock_count: parseInt(this.stockCount),
        description: this.description,
        images: this.images.map(i => ({ color: i.color, color_name: i.colorName, image_link: i.key })),
      };
      const result = this.isEdit
        ? await this.api.updateProduct({ ...payload, id: this.args.product.id })
        : await this.api.createProduct(payload);
      if (result.success) this.router.transitionTo('products');
      else this.error = result.message || 'Failed';
    } catch (err) {
      this.error = err.message;
    }
    this.isSaving = false;
  }
}
