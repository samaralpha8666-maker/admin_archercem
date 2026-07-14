export const compressImage = (
  file: File,
  maxWidth = 512,
  maxHeight = 512,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get 2D canvas context'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG format to preserve transparency. For others, convert to JPEG for high compression.
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const outputQuality = file.type === 'image/png' ? undefined : quality;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to blob conversion failed'));
            }
          },
          mimeType,
          outputQuality
        );
      };
      img.onerror = (err) => reject(new Error('Failed to load image resource'));
    };
    reader.onerror = (err) => reject(err);
  });
};
