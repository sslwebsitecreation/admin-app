export default class ImageService {
  async processAndUpload(file, uploadCallback, width = 1200, height = 1600) {
    const processedFile = await this.resizeImage(file, width, height);
    const webpBlob = await this.convertToWebP(processedFile);
    return uploadCallback(webpBlob);
  }

  async resizeImage(file, targetWidth, targetHeight) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (targetWidth - scaledWidth) / 2;
        const y = (targetHeight - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      };

      img.src = url;
    });
  }

  async convertToWebP(fileBlob) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(fileBlob);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(resolve, 'image/webp', 0.9);
      };

      img.src = url;
    });
  }
}