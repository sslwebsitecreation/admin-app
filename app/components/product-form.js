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

  get isEdit() {
    return !!this.args.product;
  }

  @action
  saveDraftOnInput() {
    this.saveDraft();
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

    const fileArray = Array.from(files);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const tempId = Date.now() + Math.random();
      const preview = URL.createObjectURL(file);
      
      const newImage = {
        tempId,
        color: '',
        key: null,
        url: null,
        preview,
        status: 'uploading'
      };
      
      const currentImages = [...this.images, newImage];
      this.images = currentImages;

      await new Promise(resolve => setTimeout(resolve, 50));

      try {
        const result = await this.api.uploadImage(file, 1200, 1600);
        
        if (result.data?.key) {
          this.images = this.images.map(img => 
            img.tempId === tempId 
              ? { ...img, key: result.data.key, url: result.data.url, status: 'uploaded' }
              : img
          );
        } else {
          this.images = this.images.map(img => 
            img.tempId === tempId 
              ? { ...img, status: 'failed', error: 'Upload failed' }
              : img
          );
        }
      } catch (err) {
        console.error('Upload error:', err);
        this.images = this.images.map(img => 
          img.tempId === tempId 
            ? { ...img, status: 'failed', error: err.message }
            : img
        );
      }
    }

    event.target.value = '';
  }

  @action
  handleColorChange(index, event) {
    const color = event.target.value;
    const newImages = [...this.images];
    newImages[index] = { ...newImages[index], color };
    this.images = newImages;
  }

  @action
  handleColorTextChange(index, event) {
    const color = event.target.value;
    if (!color || /^#[0-9A-Fa-f]{6}$/.test(color)) {
      const newImages = [...this.images];
      newImages[index] = { ...newImages[index], color };
      this.images = newImages;
    }
  }

  parseColor(color) {
    if (!color) return '#cccccc';
    if (color.startsWith('#')) return color;
    const colorMap = {
      'Red': '#FF0000', 'Blue': '#0000FF', 'Green': '#008000', 'Yellow': '#FFFF00',
      'White': '#FFFFFF', 'Black': '#000000', 'Pink': '#FFC0CB', 'Maroon': '#800000',
      'Orange': '#FFA500', 'Purple': '#800080', 'Gold': '#FFD700', 'Silver': '#C0C0C0',
      'Beige': '#F5F5DC', 'Grey': '#808080'
    };
    return colorMap[color] || color;
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
  goBack() {
    this.router.history.back();
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
        if (result.success && result.data?.success) {
          this.clearDraft();
          this.router.history.back();
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

        if (result.success && result.data?.success) {
          this.clearDraft();
          this.router.history.back();
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