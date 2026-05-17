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
  @tracked lastFile = null;
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
      if (this.args.product.images) {
        this.images = this.args.product.images.map(img => ({ ...img, preview: img.key, status: 'uploaded' }));
      }
    } else {
      this.images = [{ color: '', key: null, file: null, preview: null, status: null }];
    }
  }

  get isEdit() { return !!this.args.product; }

  get isValid() {
    if (!this.name || !this.category || !this.originalPrice || !this.stockCount) return false;
    if (this.images.length === 0) return false;
    return this.images.every(img => img.status === 'uploaded' && img.key && img.color);
  }

  @action updateName(e) { this.name = e.target.value; }
  @action updateCategory(e) { this.category = e.target.value; }
  @action updatePrice(e) { this.originalPrice = e.target.value; }
  @action updateStock(e) { this.stockCount = e.target.value; }
  @action updateDesc(e) { this.description = e.target.value; }

  @action addImage() {
    this.images = [...this.images, { color: '', key: null, file: null, preview: null, status: null }];
  }

  @action removeImage(e) {
    const idx = parseInt(e.target.dataset.removeIndex, 10);
    this.images = this.images.filter((_, i) => i !== idx);
  }

  @action handleColorInput(e) {
    const idx = parseInt(e.target.dataset.colorIndex, 10);
    const color = e.target.value;
    this.images = this.images.map((img, i) => i === idx ? { ...img, color } : img);
  }

  @action chooseFile() {
    document.getElementById('file-input').click();
  }

  @action async filePicked(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const newImg = { color: '', key: null, preview, status: 'uploading' };
    this.images = [...this.images, newImg];
    this.lastFile = file;
    e.target.value = '';

    try {
      const result = await this.api.uploadImage(file, 1200, 1600);
      this.images = this.images.map((img, i) => 
        i === this.images.length - 1 
          ? { ...img, key: result.data?.key, status: result.data?.key ? 'uploaded' : 'failed' }
          : img
      );
    } catch (err) {
      this.images = this.images.map((img, i) => 
        i === this.images.length - 1 
          ? { ...img, status: 'failed' }
          : img
      );
    }
  }

  @action goBack() { this.router.history.back(); }

  @action async handleSubmit(e) {
    e.preventDefault();
    if (!this.isValid) { this.error = 'Complete all images first'; return; }
    this.isSaving = true;
    try {
      const payload = { name: this.name, description: this.description, category: this.category, original_price: parseFloat(this.originalPrice), stock_count: parseInt(this.stockCount), images: this.images.map(i => ({ color: i.color, image_link: i.key })) };
      const result = this.isEdit ? await this.api.updateProduct({ ...payload, id: this.args.product.id }) : await this.api.createProduct(payload);
      if (result.success && result.data?.success) this.router.history.back();
      else this.error = result.message || 'Failed';
    } catch (err) { 
      this.error = err.message; 
    }
    this.isSaving = false;
  }
}