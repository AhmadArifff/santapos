'use client';

import { useMemo, useState } from 'react';
import { uploadWebsiteAsset } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { BRAND_IMAGE_EXTENSIONS, acceptFromExtensions, getFileValidationError } from '@/lib/fileValidation';
import FormGroup from './FormGroup';

export default function ImageUpload({
  label,
  value,
  onChange,
  error,
  required,
  hint,
  className = '',
  uploadKey = 'content_image',
}) {
  const [localPreview, setLocalPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const preview = localPreview || value || null;
  const previewSrc = useMemo(() => {
    if (!preview) return '';
    return /^(data:|blob:|https?:\/\/)/i.test(preview) ? preview : resolveAssetUrl(preview, '');
  }, [preview]);

  const handleChange = (e) => {
    const url = e.target.value;
    setLocalPreview(null);
    setUploadError(null);
    onChange(url);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = getFileValidationError(file, {
      allowedExtensions: BRAND_IMAGE_EXTENSIONS,
      label: 'gambar',
      maxSizeMB: 10,
    });
    if (validationError) {
      setUploadError(validationError);
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('setting_key', uploadKey);

      const response = await uploadWebsiteAsset(formData);
      const uploadedUrl = response?.data?.file_url || response?.data?.setting_value;

      if (!uploadedUrl) {
        throw new Error('Upload response missing file URL');
      }

      setLocalPreview(null);
      onChange(uploadedUrl);
      window.dispatchEvent(new CustomEvent('app:feedback', {
        detail: {
          type: 'success',
          title: 'Gambar Berhasil Diunggah',
          message: 'Gambar siap disimpan ke pengaturan.',
        },
      }));
    } catch (err) {
      const message = err?.response?.data?.message
        || err?.response?.data?.error
        || 'Gagal mengunggah gambar. Coba pilih file lain atau gunakan URL gambar.';
      setLocalPreview(null);
      setUploadError(message);
      window.dispatchEvent(new CustomEvent('app:feedback', {
        detail: {
          type: 'error',
          title: 'Upload Gambar Gagal',
          message,
        },
      }));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <FormGroup label={label} error={error || uploadError} required={required} hint={hint} className={className}>
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            accept={acceptFromExtensions(BRAND_IMAGE_EXTENSIONS)}
            onChange={handleFileSelect}
            disabled={uploading}
            className="form-input flex-1 cursor-pointer"
          />
          <button
            type="button"
            onClick={() => {
              setLocalPreview(null);
              setUploadError(null);
              onChange('');
            }}
            disabled={uploading}
            className="btn-secondary"
          >
            Hapus
          </button>
        </div>

        {uploading && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-700">
            Mengunggah gambar...
          </div>
        )}

        <div className="text-xs text-gray-400 my-2">atau tempel URL:</div>

        <input
          type="text"
          value={value || ''}
          onChange={handleChange}
          placeholder="Tempel URL gambar..."
          disabled={uploading}
          className="form-input"
        />

        {previewSrc && (
          <div className="form-image-preview-wrap">
            <img src={previewSrc} alt="Preview" className="form-image-preview" />
          </div>
        )}
      </div>
    </FormGroup>
  );
}
