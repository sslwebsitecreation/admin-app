import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const STORAGE_KEY = 'admin_product_form_draft';

export default class ProductFormComponent extends Component {
  @service api;
  @service router;

  @tracked name = '';
  @tracked description = '';
  @tracked category = '';
  @tracked originalPrice = '';
  @tracked stockCount = '';
  @tracked images = [];

  @tracked isUploading = false;
  @tracked isSaving = false;
  @tracked error = null;
  @tracked previewImage = null;

  constructor() {
    super(...arguments);
    if (this.args.product) {
      this.name = this.args.product.name || '';
      this.description = this.args.product.description || '';
      this.category = this.args.product.category || '';
      this.originalPrice = this.args.product.original_price?.toString() || '';
      this.stockCount = this.args.product.stock_count?.toString() || '';
      
      if (this.args.product.images) {
        this.images = this.args.product.images.map(img => ({
          color: img.color || '#000000',
          key: img.key,
          url: img.key,
          preview: img.key
        }));
      }
    } else {
      this.loadDraft();
    }
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  get hasUnsavedChanges() {
    return this.name || this.description || this.category || this.originalPrice || this.stockCount || this.images.length > 0;
  }

  loadDraft() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.name = data.name || '';
        this.description = data.description || '';
        this.category = data.category || '';
        this.originalPrice = data.originalPrice || '';
        this.stockCount = data.stockCount || '';
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }

  saveDraft() {
    try {
      const data = {
        name: this.name,
        description: this.description,
        category: this.category,
        originalPrice: this.originalPrice,
        stockCount: this.stockCount
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }

  clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
  }

  handleBeforeUnload = (event) => {
    if (this.hasUnsavedChanges) {
      this.saveDraft();
      event.preventDefault();
      event.returnValue = '';
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  get isValid() {
    return this.name && this.category && this.originalPrice && this.stockCount && this.images.length > 0;
  }

  get isEdit() {
    return !!this.args.product;
  }

  @action
  saveDraftOnInput() {
    this.saveDraft();
  }

  @action
  openPreview(imageUrl) {
    this.previewImage = imageUrl;
  }

  @action
  closePreview() {
    this.previewImage = null;
  }

  @action
  async handleAddImage(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    this.isUploading = true;
    this.error = null;

    try {
      for (const file of files) {
        const result = await this.api.uploadImage(file, 1200, 1600);

        if (result.key) {
          this.images = [
            ...this.images,
            {
              color: '',
              key: result.key,
              url: result.url,
              preview: URL.createObjectURL(file)
            }
          ];
        } else {
          this.error = 'Failed to upload image';
        }
      }
    } catch (err) {
      this.error = err.message || 'Upload failed';
    } finally {
      this.isUploading = false;
      event.target.value = '';
    }
  }

  @action
  handleColorChange(index, event) {
    const color = event.target.value;
    const newImages = [...this.images];
    newImages[index] = { ...newImages[index], color };
    this.images = newImages;
  }

  @action
  updateName(event) {
    this.name = event.target.value;
    this.saveDraft();
  }

  @action
  updateCategory(event) {
    this.category = event.target.value;
    this.saveDraft();
  }

  @action
  updateOriginalPrice(event) {
    this.originalPrice = event.target.value;
    this.saveDraft();
  }

  @action
  updateStockCount(event) {
    this.stockCount = event.target.value;
    this.saveDraft();
  }

  @action
  updateDescription(event) {
    this.description = event.target.value;
    this.saveDraft();
  }

  @action
  async handleRemoveImage(index) {
    const image = this.images[index];
    if (image.key) {
      try {
        await this.api.deleteImage(image.key);
      } catch (err) {
        console.error('Failed to delete image:', err);
      }
    }
    if (image.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(image.preview);
    }
    this.images = this.images.filter((_, i) => i !== index);
  }

  @action
  async handleSubmit(event) {
    event.preventDefault();

    if (!this.isValid) {
      this.error = 'Please fill all required fields and add at least one image';
      return;
    }

    const imagesPayload = this.images.map(img => ({
      color: img.color || '#000000',
      image_link: img.key
    }));

    this.isSaving = true;
    this.error = null;

    try {
      if (this.isEdit) {
        const result = await this.api.updateProduct({
          id: this.args.product.id,
          name: this.name,
          description: this.description,
          category: this.category,
          original_price: parseFloat(this.originalPrice),
          stock_count: parseInt(this.stockCount),
          images: imagesPayload
        });
        if (result.products) {
          this.clearDraft();
          this.router.transitionTo('products');
        } else {
          this.error = result.message || 'Failed to update product';
        }
      } else {
        const result = await this.api.createProduct({
          name: this.name,
          description: this.description,
          category: this.category,
          original_price: parseFloat(this.originalPrice),
          stock_count: parseInt(this.stockCount),
          images: imagesPayload
        });

        if (result.products) {
          this.clearDraft();
          this.router.transitionTo('products');
        } else {
          this.error = result.message || 'Failed to create product';
        }
      }
    } catch (err) {
      this.error = err.message || 'Failed to save product';
    } finally {
      this.isSaving = false;
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this.images.forEach(img => {
      if (img.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview);
      }
    });
  }
}