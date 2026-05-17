import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

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

  constructor() {
    super(...arguments);
    if (this.args.product) {
      this.name = this.args.product.name || '';
      this.description = this.args.product.description || '';
      this.category = this.args.product.category || '';
      this.originalPrice = this.args.product.original_price?.toString() || '';
      this.stockCount = this.args.product.stock_count?.toString() || '';
      this.images = this.args.product.images ? [...this.args.product.images] : [];
    }
  }

  get isValid() {
    return this.name && this.category && this.originalPrice && this.stockCount && this.images.length > 0;
  }

  get isEdit() {
    return !!this.args.product;
  }

  @action
  async handleAddImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploading = true;
    this.error = null;

    try {
      const result = await this.api.uploadImage(file, 1200, 1600);

      if (result.success) {
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
        this.error = result.message || 'Failed to upload image';
      }
    } catch (err) {
      this.error = err.message || 'Upload failed';
    } finally {
      this.isUploading = false;
      event.target.value = '';
    }
  }

  @action
  handleColorChange(index, color) {
    const newImages = [...this.images];
    newImages[index] = { ...newImages[index], color };
    this.images = newImages;
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
      color: img.color || 'Default',
      image_link: img.url || img.key
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