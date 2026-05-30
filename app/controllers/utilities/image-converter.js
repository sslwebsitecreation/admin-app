import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const IMAGE_MAX_SIZE_KEY = 'image-max-size-kb';
const DEFAULT_MAX_SIZE_KB = 300;

function getMaxSizeKB() {
  const stored = localStorage.getItem(IMAGE_MAX_SIZE_KEY);
  return stored ? parseInt(stored, 10) : DEFAULT_MAX_SIZE_KB;
}

export default class UtilitiesImageConverterController extends Controller {
  @service imageProcessor;
  @service router;

  @tracked selectedFile = null;
  @tracked originalPreview = null;
  @tracked convertedPreview = null;
  @tracked convertedBlob = null;
  @tracked isProcessing = false;
  @tracked error = null;
  @tracked quality = 90;
  @tracked width = 1200;
  @tracked height = 1600;
  @tracked maxSizeKB = getMaxSizeKB();
  @tracked targetSizeKB = 200;
  @tracked fileInfo = null;
  @tracked convertedSize = null;
  @tracked showExactPreview = false;
  @tracked showOriginalFull = false;
  @tracked downloadFileName = '';

  @action
  handleMaxSizeChange(event) {
    const value = parseInt(event.target.value) || DEFAULT_MAX_SIZE_KB;
    const clamped = Math.min(Math.max(value, 100), 400);
    this.maxSizeKB = clamped;
    localStorage.setItem(IMAGE_MAX_SIZE_KEY, clamped.toString());
  }

  @action
  async handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.error = null;
    this.convertedPreview = null;
    this.convertedBlob = null;

    const validation = this.imageProcessor.validateFile(file, {
      maxSizeKB: 5000,
      allowedFormats: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
      ],
    });

    if (!validation.valid) {
      this.error = validation.errors.join(', ');
      return;
    }

    this.selectedFile = file;
    this.originalPreview = URL.createObjectURL(file);

    try {
      const dims = await this.imageProcessor.getImageDimensions(file);
      this.fileInfo = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        width: dims.width,
        height: dims.height,
        format: file.type.split('/')[1].toUpperCase(),
      };
    } catch (err) {
      this.error = 'Failed to read image';
    }
  }

  @action
  async handleConvert() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.error = null;

    try {
      const result = await this.imageProcessor.processImage(this.selectedFile, {
        width: this.width,
        height: this.height,
        quality: this.quality / 100,
        targetSizeKB: this.targetSizeKB,
      });

      this.convertedBlob = result.blob;
      this.convertedPreview = URL.createObjectURL(result.blob);
      this.convertedSize = (result.blob.size / 1024).toFixed(1) + ' KB';

      const originalName =
        this.selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'image';
      this.downloadFileName = `${originalName}_${this.width}x${this.height}.webp`;
    } catch (err) {
      this.error = err.message;
    } finally {
      this.isProcessing = false;
    }
  }

  @action
  handleQualityChange(event) {
    this.quality = parseInt(event.target.value);
    if (this.convertedBlob) {
      this.handleConvert();
    }
  }

  @action
  handleDimensionChange(type, event) {
    const value = parseInt(event.target.value) || 0;
    if (type === 'width') {
      this.width = value;
    } else {
      this.height = value;
    }
  }

  @action
  handleTargetSizeChange(event) {
    const value = parseInt(event.target.value) || 200;
    if (value > this.maxSizeKB) {
      this.error = `Target size cannot exceed ${this.maxSizeKB} KB`;
      this.targetSizeKB = this.maxSizeKB;
    } else {
      this.targetSizeKB = value;
      this.error = null;
    }
  }

  @action
  handleDownload() {
    if (!this.convertedBlob) return;

    const link = document.createElement('a');
    link.href = this.convertedPreview;
    link.download = this.downloadFileName || 'image.webp';
    link.click();
  }

  @action
  handleReset() {
    this.selectedFile = null;
    this.originalPreview = null;
    this.convertedPreview = null;
    this.convertedBlob = null;
    this.convertedSize = null;
    this.showExactPreview = false;
    this.error = null;
    this.fileInfo = null;
    document.getElementById('ic-file-input').value = '';
  }

  @action
  handleViewExactSize() {
    this.showExactPreview = true;
  }

  @action
  handleCloseExactPreview() {
    this.showExactPreview = false;
  }

  @action
  handleFileNameChange(event) {
    let name = event.target.value;
    if (!name.endsWith('.webp')) {
      name = name + '.webp';
    }
    this.downloadFileName = name;
  }

  @action
  stopPropagation(e) {
    e.stopPropagation();
  }

  @action
  handleViewOriginalFull() {
    this.showOriginalFull = true;
  }

  @action
  handleCloseOriginalFull() {
    this.showOriginalFull = false;
  }

  willDestroy() {
    super.willDestroy(...arguments);
    if (this.originalPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.originalPreview);
    }
    if (this.convertedPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.convertedPreview);
    }
  }
}
