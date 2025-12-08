/**
 * Converts a file to WebP format using HTML5 Canvas
 * @param file The file to convert
 * @param quality Quality of the output WebP image (0 to 1)
 * @returns Promise resolving to the converted File
 */
export const convertImageToWebP = (
  file: File,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If it's already a WebP or not an image, return original
    if (file.type === "image/webp" || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);

          if (!blob) {
            reject(new Error("Failed to convert image to WebP"));
            return;
          }

          // Create new file with .webp extension
          const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const newFile = new File([blob], newFileName, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          resolve(newFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image for conversion"));
    };
  });
};
