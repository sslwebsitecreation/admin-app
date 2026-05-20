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
  @tracked discountedPrice = '';
  @tracked stockCount = '';
  @tracked tags = '';

  @tracked images = [];

  @tracked lastFile = null;

  @tracked isSaving = false;
  @tracked error = null;
  @tracked successMessage = null;

  constructor() {

    super(...arguments);

    if (this.args.product) {

      this.name = this.args.product.name || '';
      this.description = this.args.product.description || '';
      this.category = this.args.product.category || '';
      this.tags = this.args.product.tags || '';

      this.originalPrice =
        this.args.product.original_price?.toString() || '';

      this.discountedPrice =
        this.args.product.discounted_price?.toString() || '';

      this.stockCount =
        this.args.product.stock_count?.toString() || '';

      if (this.args.product.images) {

        this.images = this.args.product.images.map(img => ({
          ...img,
          preview: img.url || img.key,
          status: 'uploaded'
        }));

      }

    } else {

      this.images = [
        {
          color: '',
          key: null,
          file: null,
          preview: null,
          status: null
        }
      ];
    }
  }

  get isEdit() {
    return !!this.args.product;
  }

  get isValid() {

    if (
      !this.name ||
      !this.category ||
      !this.originalPrice ||
      !this.stockCount
    ) {
      return false;
    }

    if (this.images.length === 0) {
      return false;
    }

    return this.images.every(img =>
      img.status === 'uploaded' &&
      img.key &&
      img.color
    );
  }

  @action
  updateName(e) {
    this.name = e.target.value;
  }

  @action
  updateCategory(e) {
    this.category = e.target.value;
  }

  @action
  updatePrice(e) {
    this.originalPrice = e.target.value;
  }

  @action
  updateDiscountPrice(e) {
    this.discountedPrice = e.target.value;
  }

  @action
  updateStock(e) {
    this.stockCount = e.target.value;
  }

  @action
  updateDesc(e) {
    this.description = e.target.value;
  }

  @action
  updateTags(e) {
    this.tags = e.target.value;
  }

  @action
  addImage() {

    this.images = [
      ...this.images,
      {
        color: '',
        key: null,
        file: null,
        preview: null,
        status: null
      }
    ];
  }

  @action
  removeImage(e) {

    const idx = parseInt(
      e.target.dataset.removeIndex,
      10
    );

    if (this.images.length === 1) {
      return;
    }

    this.images = this.images.filter((_, i) => i !== idx);
  }

  @action
  handleColorInput(e) {

    const idx = parseInt(
      e.target.dataset.colorIndex,
      10
    );

    const color = e.target.value;

    this.images = this.images.map((img, i) =>
      i === idx
        ? {
            ...img,
            color
          }
        : img
    );
  }

  @action
  chooseFile(index) {

    const input = document.getElementById(
      `file-input-${index}`
    );

    if (input) {
      input.click();
    }
  }

  @action
  async filePicked(index, e) {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    this.error = null;

    const allowedTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

if (!allowedTypes.includes(file.type)) {

  this.error =
    'Only JPG, PNG, and WEBP images are allowed';

  return;
}

    if (file.size > 400 * 1024) {

      this.error = 'Image size must be below 400KB';
      return;
    }

    const preview = URL.createObjectURL(file);

    this.images = this.images.map((img, i) =>
      i === index
        ? {
            ...img,
            file,
            preview,
            status: 'uploading'
          }
        : img
    );

    this.lastFile = file;

    try {

      const result = await this.api.uploadImage(
        file,
        1200,
        1600
      );

      this.images = this.images.map((img, i) =>
        i === index
          ? {
              ...img,
              key: result.data?.key,
              preview:
                result.data?.url || preview,
              status:
                result.data?.key
                  ? 'uploaded'
                  : 'failed'
            }
          : img
      );

    } catch (err) {

      this.images = this.images.map((img, i) =>
        i === index
          ? {
              ...img,
              status: 'failed'
            }
          : img
      );

      this.error =
        err.message || 'Image upload failed';
    }
  }

  @action
  retryUpload(index) {

    const input = document.getElementById(
      `file-input-${index}`
    );

    if (input) {
      input.click();
    }
  }

  @action
  goBack() {
    this.router.history.back();
  }

  @action
  async handleSubmit(e) {

    e.preventDefault();

    this.error = null;
    this.successMessage = null;

    if (!this.isValid) {

      this.error =
        'Complete all image uploads and fields';

      return;
    }

    this.isSaving = true;

    try {

      const payload = {

        name: this.name,
        description: this.description,
        category: this.category,
        tags: this.tags,

        original_price: parseFloat(
          this.originalPrice
        ),

        discounted_price: this.discountedPrice
          ? parseFloat(this.discountedPrice)
          : null,

        stock_count: parseInt(
          this.stockCount,
          10
        ),

        images: this.images.map(i => ({
          color: i.color,
          key: i.key
        }))
      };

      const result = this.isEdit

        ? await this.api.updateProduct({
            ...payload,
            id: this.args.product.id
          })

        : await this.api.createProduct(
            payload
          );

      if (
        result.success &&
        (
          result.data?.product_id ||
          result.data?.updated_id
        )
      ) {

        try {

          await this.api.rebuildCache();

        } catch (cacheErr) {

          console.error(
            'Cache rebuild failed',
            cacheErr
          );
        }

        this.successMessage = this.isEdit
          ? 'Product updated successfully'
          : 'Product created successfully';

        setTimeout(() => {
          this.router.history.back();
        }, 1000);

      } else {

        this.error =
          result.message ||
          'Failed to save product';
      }

    } catch (err) {

      this.error = err.message;

    } finally {

      this.isSaving = false;
    }
  }
}