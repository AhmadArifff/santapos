import { uploadWebsiteAsset } from '@/lib/api';

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isInlineImage = (value) =>
  typeof value === 'string' && /^data:image\//i.test(value);

const safeUploadKey = (parts) =>
  parts
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'content_image';

const dataUrlToFile = async (dataUrl, keyParts) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const ext = blob.type?.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  return new File([blob], `${safeUploadKey(keyParts)}.${ext}`, {
    type: blob.type || 'image/png',
  });
};

const uploadInlineImage = async (dataUrl, keyParts) => {
  const file = await dataUrlToFile(dataUrl, keyParts);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('setting_key', safeUploadKey(keyParts));

  const response = await uploadWebsiteAsset(formData);
  const uploadedUrl = response?.data?.file_url || response?.data?.setting_value;

  if (!uploadedUrl) {
    throw new Error('Gagal mengunggah gambar pengaturan.');
  }

  return uploadedUrl;
};

export const uploadInlineImagesInSettings = async (value, keyParts = ['content']) => {
  if (isInlineImage(value)) {
    const uploadedUrl = await uploadInlineImage(value, keyParts);
    return { value: uploadedUrl, changed: true };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = [];

    for (let index = 0; index < value.length; index += 1) {
      const result = await uploadInlineImagesInSettings(value[index], [...keyParts, index]);
      next.push(result.value);
      changed = changed || result.changed;
    }

    return { value: next, changed };
  }

  if (isPlainObject(value)) {
    let changed = false;
    const next = {};

    for (const [key, childValue] of Object.entries(value)) {
      const result = await uploadInlineImagesInSettings(childValue, [...keyParts, key]);
      next[key] = result.value;
      changed = changed || result.changed;
    }

    return { value: next, changed };
  }

  return { value, changed: false };
};
