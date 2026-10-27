export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const BRAND_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'ico'];
export const PAYMENT_PROOF_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

export const acceptFromExtensions = (extensions) =>
  extensions.map((ext) => `.${ext}`).join(',');

export const getFileExtension = (file) => {
  const name = String(file?.name || '');
  const ext = name.split('.').pop();
  return ext && ext !== name ? ext.toLowerCase() : '';
};

export const getFileValidationError = (file, {
  allowedExtensions = IMAGE_EXTENSIONS,
  label = 'file',
  maxSizeMB,
} = {}) => {
  if (!file) return null;

  const ext = getFileExtension(file);
  if (!allowedExtensions.includes(ext)) {
    return `Format ${label} tidak didukung. Gunakan ${allowedExtensions.map((item) => item.toUpperCase()).join(', ')}.`;
  }

  if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
    return `Ukuran ${label} maksimal ${maxSizeMB}MB.`;
  }

  return null;
};
