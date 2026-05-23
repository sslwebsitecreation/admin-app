import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { next } from '@ember/runloop';

let _rowId = 1;

class ImageRow {
  rowKey = `r${_rowId++}`;
  @tracked color = '';
  @tracked colorInput = '';
  @tracked colorName = '';
  @tracked key = null;
  @tracked file = null;
  @tracked preview = null;
  @tracked status = null;
  @tracked showActions = true;
  @tracked isConverting = false;
  @tracked isUploading = false;
  @tracked isFailed = false;
  @tracked isDeleting = false;
  @tracked colorError = '';
}

function applyStatus(row, status) {
  row.status = status;
  row.showActions = !(status === 'converting' || status === 'uploading');
  row.isConverting = status === 'converting';
  row.isUploading = status === 'uploading';
  row.isFailed = status === 'failed';
}

let CATEGORIES = [
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
  @service data;

  @tracked name = '';
  @tracked category = '';
  @tracked categorySearch = '';
  @tracked showCategoryDropdown = false;
  @tracked originalPrice = '';
  @tracked discountedPrice = '';
  @tracked stockCount = '';
  @tracked description = '';
  @tracked images = [];
  @tracked tags = [];
  @tracked tagSearch = '';
  @tracked showTagDropdown = false;
  @tracked isSaving = false;
  @tracked error = null;
  @tracked targetImageIndex = -1;
  @tracked modalData = null;
  @tracked previewModalData = null;

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
        this.images = p.images.map(src => {
          const row = new ImageRow();
          row.key = src.key;
          row.color = src.color || '';
          row.colorInput = src.color || '';
          row.colorName = src.color_name || '';
          row.preview = src.key;
          row.status = 'uploaded';
          return row;
        });
      }
    } else {
      this.images = [new ImageRow()];
    }
  }

  emptyRow() {
    return new ImageRow();
  }

  get isEdit() { return !!this.args.product; }
  get canRemoveImages() { return this.images.length > 1 && !this.images.some(i => i.isDeleting); }
  get isInvalid() { return !this.isValid; }

  get isValid() {
    if (!this.name || !this.category || !this.originalPrice || !this.stockCount) return false;
    if (this.images.length === 0) return false;
    return this.images.every(row => row.status === 'uploaded' && row.key && row.color);
  }

  get filteredCategories() {
    const q = (this.categorySearch || '').toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(c => c.toLowerCase().includes(q));
  }

  get filteredTagItems() {
    const q = (this.tagSearch || '').toLowerCase();
    let items = TAG_SUGGESTIONS;
    if (q) {
      items = items.filter(t => t.toLowerCase().includes(q));
    }
    return items.map(t => ({ name: t, selected: this.tags.includes(t) }));
  }

  get visibleTags() {
    return this.tags.slice(0, 2);
  }

  get remainingTagCount() {
    return Math.max(0, this.tags.length - 2);
  }

  // --- helpers ---
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

  extractColorFromImage(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const cx = Math.floor(img.width / 2);
    const cy = Math.floor(img.height / 2);
    const pixel = ctx.getImageData(cx, cy, 1, 1).data;
    const r = pixel[0].toString(16).padStart(2, '0');
    const g = pixel[1].toString(16).padStart(2, '0');
    const b = pixel[2].toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  // --- simple field actions ---
  @action updateName(e) { this.name = e.target.value; }
  @action updatePrice(e) { this.originalPrice = e.target.value; }
  @action updateDiscountedPrice(e) { this.discountedPrice = e.target.value; }
  @action updateStock(e) { this.stockCount = e.target.value; }
  @action updateDesc(e) { this.description = e.target.value; }

  // --- category dropdown ---
  @action toggleCategoryDropdown() {
    this.showCategoryDropdown = !this.showCategoryDropdown;
    if (this.showCategoryDropdown) {
      this.categorySearch = '';
    }
  }

  @action openCategoryDropdown() {
    this.showCategoryDropdown = true;
    this.categorySearch = '';
  }

  @action closeCategoryDropdown() {
    this.showCategoryDropdown = false;
    this.categorySearch = '';
  }

  @action handleDropdownFocusOut(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      next(this, () => {
        this.showCategoryDropdown = false;
        this.categorySearch = '';
      });
    }
  }

  @action handleCategorySearch(e) {
    this.categorySearch = e.currentTarget.value;
  }

  @action handleCategoryKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = (this.categorySearch || '').trim();
      if (val) {
        this.setCategory(val);
      }
    }
    if (e.key === 'Escape') {
      this.closeCategoryDropdown();
    }
  }

  @action selectCategory(cat) {
    this.setCategory(cat);
  }

  @action addCustomCategory() {
    const val = (this.categorySearch || '').trim();
    if (val) {
      this.setCategory(val);
      if (!CATEGORIES.includes(val)) {
        CATEGORIES.push(val);
      }
    }
  }

  setCategory(val) {
    this.category = val;
    this.categorySearch = '';
    this.showCategoryDropdown = false;
  }

  @action clearCategory(e) {
    e.stopPropagation();
    this.category = '';
    this.categorySearch = '';
  }

  // --- tags multi dropdown ---
  @action toggleTagDropdown() {
    this.showTagDropdown = !this.showTagDropdown;
    if (this.showTagDropdown) {
      this.tagSearch = '';
    }
  }

  @action handleTagFocusOut(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      next(this, () => {
        this.showTagDropdown = false;
        this.tagSearch = '';
      });
    }
  }

  @action handleTagSearch(e) {
    this.tagSearch = e.currentTarget.value;
  }

  @action handleTagKeydown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = (this.tagSearch || '').trim();
      if (val && !this.tags.includes(val)) {
        this.tags = [...this.tags, val];
      }
      this.tagSearch = '';
    }
    if (e.key === 'Escape') {
      this.showTagDropdown = false;
      this.tagSearch = '';
    }
  }

  @action addTagSuggestion(tag) {
    if (this.tags.includes(tag)) {
      this.tags = this.tags.filter(t => t !== tag);
    } else {
      this.tags = [...this.tags, tag];
    }
    this.tagSearch = '';
  }

  @action addCustomTag() {
    const val = (this.tagSearch || '').trim();
    if (val && !this.tags.includes(val)) {
      this.tags = [...this.tags, val];
      if (!TAG_SUGGESTIONS.includes(val)) {
        TAG_SUGGESTIONS.push(val);
      }
    }
    this.tagSearch = '';
  }

  @action removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  @action clearTags(e) {
    e.stopPropagation();
    this.tags = [];
    this.tagSearch = '';
  }

  // --- images / variants ---
  @action addImage() {
    this.images = [...this.images, new ImageRow()];
  }

  @action async removeImage(e) {
    const idx = parseInt(e.currentTarget.dataset.removeIndex, 10);
    const row = this.images[idx];
    if (!row || row.isDeleting) return;

    row.isDeleting = true;

    if (row.key) {
      try {
        await this.api.deleteImage(row.key);
      } catch (_) { }
    }

    this.images = this.images.filter((_, i) => i !== idx);
  }

  @action chooseVariantImage(idx) {
    this.targetImageIndex = idx;
    document.getElementById('file-input').click();
  }

  @action handleUploadBoxClick(e) {
    const idx = parseInt(e.currentTarget.dataset.variantIdx, 10);
    const row = this.images[idx];
    if (!row || row.isConverting || row.isUploading) return;
    if (row.preview) {
      this.showPreviewImage(row.key);
    } else {
      this.chooseVariantImage(idx);
    }
  }

  @action handleColorPicked(e) {
    const idx = parseInt(e.currentTarget.dataset.colorIndex, 10);
    const val = e.currentTarget.value;
    const row = this.images[idx];
    if (!row) return;
    row.color = val;
    row.colorInput = val;
    row.colorError = '';
  }

  @action handleColorInput(e) {
    const idx = parseInt(e.currentTarget.dataset.colorIndex, 10);
    const row = this.images[idx];
    if (!row) return;
    row.colorInput = e.currentTarget.value;
    row.colorError = '';
  }

  @action handleColorBlur(e) {
    const idx = parseInt(e.currentTarget.dataset.colorIndex, 10);
    const row = this.images[idx];
    if (!row) return;
    const val = (e.currentTarget.value || '').trim();
    if (!val) {
      row.color = '';
      row.colorInput = '';
      row.colorError = '';
      return;
    }
    if (!this.isValidHex(val)) {
      row.colorError = `Invalid hex color: ${val}`;
      return;
    }
    row.color = val;
    row.colorInput = val;
    row.colorError = '';
  }

  @action handleColorNameInput(e) {
    const idx = parseInt(e.currentTarget.dataset.colorNameIndex, 10);
    const row = this.images[idx];
    if (!row) return;
    row.colorName = e.currentTarget.value;
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
    const row = this.images[idx];
    if (!row) return;

    row.preview = previewUrl;
    applyStatus(row, 'converting');
    this.error = null;

    try {
      const result = await this.convertToWebP(file);

      const os = result.originalSize;
      const cs = result.convertedSize;
      const cr = os && cs ? ((os - cs) / os * 100).toFixed(1) : '';
      const fmt = (b) => { if (!b) return ''; if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; };

      const loadedImg = new Image();
      loadedImg.src = previewUrl;
      await new Promise(r => { loadedImg.onload = r; });
      const autoColor = this.extractColorFromImage(loadedImg);

      row.colorInput = autoColor;
      row.color = autoColor;

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
      applyStatus(row, 'failed');
      this.error = err.message || 'Image conversion failed';
    }
  }

  @action acceptImage() {
    if (!this.modalData) return;
    const { targetIndex, webpBlob } = this.modalData;
    const webpFile = new File([webpBlob], 'image.webp', { type: 'image/webp' });
    const row = this.images[targetIndex];
    if (!row) return;
    applyStatus(row, 'uploading');
    this.doUpload(targetIndex, webpFile);
  }

  async doUpload(targetIndex, webpFile) {
    const row = this.images[targetIndex];
    if (!row) return;
    try {
      const result = await this.api.uploadImage(webpFile, 1200, 1600);
      const status = result.data?.key ? 'uploaded' : 'failed';
      applyStatus(row, status);
      row.key = result.data?.key || '';
      row.preview = result.data?.url;
    } catch (err) {
      applyStatus(row, 'failed');
    }
    next(() => {
      this.modalData = null;
      this.error = null;
    });
  }

  // --- modal actions ---
  @action cancelImage() {
    if (!this.modalData) return;
    const idx = this.modalData.targetIndex;
    this.images = this.images.map((row, i) =>
      i === idx ? new ImageRow() : row
    );
    this.modalData = null;
    this.error = null;
  }

  @action showPreviewImage(key) {
    this.previewModalData = { key };
  }

  @action closePreviewModal() {
    this.previewModalData = null;
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
        images: this.images.map(r => ({ color: r.color, color_name: r.colorName, image_link: r.key })),
      };
      const result = this.isEdit
        ? await this.api.updateProduct({ ...payload, id: this.args.product.id })
        : await this.api.createProduct(payload);
      if (result.success) {
        if (this.isEdit) {
          this.data.products = this.data.products.map(p =>
            p.id === this.args.product.id ? { ...p, ...payload } : p
          );
        } else {
          this.data.products = [...this.data.products, {
            id: result.data?.product_id || Date.now(),
            ...payload,
            images: this.images.map(r => ({
              color: r.color,
              color_name: r.colorName,
              key: r.key,
            })),
            created_at: new Date().toISOString(),
          }];
        }
        await this.data.saveToIndexedDB();
        this.router.transitionTo('products');
      } else this.error = result.message || 'Failed';
    } catch (err) {
      this.error = err.message;
    }
    this.isSaving = false;
  }
}
