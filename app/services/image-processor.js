import Service from '@ember/service';

export default class ImageProcessorService extends Service {
  async processImage(file, options = {}) {
    const {
      width = 1200,
      height = 1600,
      quality = 0.9,
      maintainAspectRatio = true,
      backgroundColor = '#ffffff'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        let drawWidth, drawHeight, drawX, drawY;

        if (maintainAspectRatio) {
          const scale = Math.max(width / img.width, height / img.height);
          drawWidth = img.width * scale;
          drawHeight = img.height * scale;
          drawX = (width - drawWidth) / 2;
          drawY = (height - drawHeight) / 2;
        } else {
          drawWidth = width;
          drawHeight = height;
          drawX = 0;
          drawY = 0;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        const targetSizeKB = options.targetSizeKB || null;
        
        if (targetSizeKB) {
          this.convertWithSizeLimit(canvas, targetSizeKB, width, height, file.name, resolve, reject);
        } else {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  blob,
                  width,
                  height,
                  quality,
                  originalName: file.name,
                  convertedName: this.generateWebPName(file.name)
                });
              } else {
                reject(new Error('Failed to convert image'));
              }
            },
            'image/webp',
            quality
          );
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  }

  generateWebPName(originalName) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_${Date.now()}.webp`;
  }

  getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  }

  validateFile(file, options = {}) {
    const {
      maxSizeKB = 400,
      requiredWidth = 1200,
      requiredHeight = 1600,
      allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
    } = options;

    const errors = [];

    if (!allowedFormats.includes(file.type)) {
      errors.push(`Invalid format. Allowed: ${allowedFormats.map(f => f.split('/')[1]).join(', ')}`);
    }

    const sizeKB = file.size / 1024;
    if (sizeKB > maxSizeKB) {
      errors.push(`File too large: ${sizeKB.toFixed(1)}KB (max: ${maxSizeKB}KB)`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  convertWithSizeLimit(canvas, targetSizeKB, width, height, originalName, resolve, reject) {
    let quality = 0.9;
    const minQuality = 0.1;
    const step = 0.1;

    const tryConvert = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }

          const currentSizeKB = blob.size / 1024;

          if (currentSizeKB <= targetSizeKB || quality <= minQuality) {
            resolve({
              blob,
              width,
              height,
              quality,
              originalName,
              convertedName: this.generateWebPName(originalName),
              actualSizeKB: currentSizeKB.toFixed(1)
            });
          } else {
            quality -= step;
            tryConvert();
          }
        },
        'image/webp',
        quality
      );
    };

    tryConvert();
  }
}