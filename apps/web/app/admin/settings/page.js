'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useWebsiteSettings, DEFAULT_THEME_COLORS, DEFAULT_SETTINGS } from '@/store/settingsStore';
import { uploadWebsiteImage, bulkUpdateWebsiteSettings } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { BRAND_IMAGE_EXTENSIONS, acceptFromExtensions, getFileValidationError } from '@/lib/fileValidation';
import FaviconDebugger from '@/components/ui/FaviconDebugger';
import SectionSkeleton from '@/components/ui/SectionSkeleton';

const THEME_FIELDS = [
  { key: 'gold', label: 'Gold (Primary Accent / Logo & Buttons)', fallback: DEFAULT_THEME_COLORS.gold },
  { key: 'gold_light', label: 'Gold Light (Hover States & Highlights)', fallback: DEFAULT_THEME_COLORS.gold_light },
  { key: 'dark', label: 'Dark (Body Background)', fallback: DEFAULT_THEME_COLORS.dark },
  { key: 'dark2', label: 'Dark2 (Section Background)', fallback: DEFAULT_THEME_COLORS.dark2 },
  { key: 'dark3', label: 'Dark3 (Footer & Overlay Background)', fallback: DEFAULT_THEME_COLORS.dark3 },
  { key: 'cream', label: 'Cream (Primary Text & Logo Secondary)', fallback: DEFAULT_THEME_COLORS.cream },
  { key: 'cream2', label: 'Cream2 (Navigation Links & Secondary Text)', fallback: DEFAULT_THEME_COLORS.cream2 },
  { key: 'red', label: 'Red (Badge Spicy & Alert / Brand Accent)', fallback: DEFAULT_THEME_COLORS.red },
  { key: 'text', label: 'Text (Main Paragraph Text)', fallback: DEFAULT_THEME_COLORS.text },
  { key: 'text_muted', label: 'Text Muted (Secondary & Section Labels)', fallback: DEFAULT_THEME_COLORS.text_muted },
];

const validators = {
  store_name: (value) => {
    if (!value || !value.trim()) return 'Nama toko tidak boleh kosong';
    if (value.trim().length < 3) return 'Nama toko minimal 3 karakter';
    if (value.length > 50) return 'Nama toko maksimal 50 karakter';
    return null;
  },
  browser_title: (value) => {
    if (!value || !value.trim()) return 'Judul tab browser tidak boleh kosong';
    if (value.length > 60) return 'Judul tab browser maksimal 60 karakter';
    return null;
  },
  hexColor: (value) => {
    if (!value) return 'Warna tidak boleh kosong';
    return /^#[0-9a-fA-F]{6}$/.test(value) ? null : 'Format warna harus HEX (contoh: #C9A84C)';
  },
  file_size: (file) => {
    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) return `Ukuran file maksimal ${maxSizeInMB}MB`;
    return null;
  },
  file_type: (file) => {
    return getFileValidationError(file, {
      allowedExtensions: BRAND_IMAGE_EXTENSIONS,
      label: 'gambar',
    });
  },
};

export default function SettingsPage() {
  const { settings, loadSettings, updateSettings } = useWebsiteSettings();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const themeFieldKeys = useMemo(() => THEME_FIELDS.map((field) => field.key), []);

  const buildErrorMessage = (err, fallbackMessage) => {
    if (err?.code === 'ERR_NETWORK') {
      return 'Tidak bisa terhubung ke backend. Pastikan server backend aktif di http://localhost:5000';
    }
    return err?.response?.data?.error || err?.message || fallbackMessage;
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadSettings();
      } catch {
        setError('Gagal memuat pengaturan');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadSettings]);

  const validateField = (fieldName, value) => {
    if (fieldName in DEFAULT_THEME_COLORS) {
      return validators.hexColor(value);
    }
    const fn = validators[fieldName];
    return fn ? fn(value) : null;
  };

  const handleInputChange = (key, value) => {
    updateSettings({ [key]: value });
    const err = validateField(key, value);
    setFieldErrors((prev) => ({ ...prev, [key]: err }));
  };

  const handleColorChange = (key, color) => {
    updateSettings({ [key]: color });
    const err = validateField(key, color);
    setFieldErrors((prev) => ({ ...prev, [key]: err }));
  };

  const handleImageSelect = (e, settingKey, setFile, setPreview) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeError = validators.file_size(file);
    const typeError = validators.file_type(file);
    if (sizeError || typeError) {
      setFieldErrors((prev) => ({ ...prev, [settingKey]: sizeError || typeError }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, [settingKey]: null }));
    setFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target?.result || null);
    reader.readAsDataURL(file);
  };

  const validateAllFields = () => {
    const nextErrors = {};
    const toValidate = ['store_name', 'browser_title', ...themeFieldKeys];

    toValidate.forEach((key) => {
      const err = validateField(key, settings[key] || '');
      if (err) nextErrors[key] = err;
    });

    setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const uploadImage = async (file, settingKey) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('setting_key', settingKey);
    const response = await uploadWebsiteImage(formData);
    return response?.data?.setting_value || response?.data?.file_url || null;
  };

  const handleSaveSettings = async () => {
    try {
      if (!validateAllFields()) {
        setError('Silakan perbaiki kesalahan di form sebelum menyimpan');
        window.dispatchEvent(new CustomEvent('app:feedback', {
          detail: {
            type: 'warning',
            title: 'Form Belum Lengkap',
            message: 'Silakan perbaiki kesalahan di form sebelum menyimpan.',
          },
        }));
        setTimeout(() => setError(null), 4000);
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = [];

      if (logoFile) {
        const logoUrl = await uploadImage(logoFile, 'logo_url');
        if (logoUrl) {
          payload.push({ setting_key: 'logo_url', setting_value: logoUrl, data_type: 'string' });
        }
        setLogoFile(null);
        setLogoPreview(null);
      }

      if (faviconFile) {
        const faviconUrl = await uploadImage(faviconFile, 'favicon_url');
        if (faviconUrl) {
          payload.push({ setting_key: 'favicon_url', setting_value: faviconUrl, data_type: 'string' });
        }
        setFaviconFile(null);
        setFaviconPreview(null);
      }

      ['store_name', 'browser_title'].forEach((key) => {
        payload.push({
          setting_key: key,
          setting_value: settings[key] || DEFAULT_SETTINGS[key] || '',
          data_type: 'string',
        });
      });

      THEME_FIELDS.forEach(({ key, fallback }) => {
        payload.push({
          setting_key: key,
          setting_value: settings[key] || fallback,
          data_type: 'string',
        });
      });

      await bulkUpdateWebsiteSettings(payload);
      setRefreshing(true);
      await loadSettings({ force: true });
      setSuccess('Pengaturan berhasil disimpan. Tema warna diterapkan ke landing page, login, dan admin panel.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(buildErrorMessage(err, 'Gagal menyimpan pengaturan'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setRefreshing(false);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto py-8">
          <SectionSkeleton />
        </div>
      </AdminLayout>
    );
  }

  const hasFieldError = Object.values(fieldErrors).some(Boolean);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto pb-8" data-tour="settings-page">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3" data-tour="settings-header">
          <div>
            <h1 className="text-white text-2xl font-bold">Pengaturan Website</h1>
            <p className="text-slate-400 text-sm mt-2">
              Tema default mengikuti tampilan aplikasi saat ini. Jika ada data warna di database, sistem otomatis menggunakan data tersebut.
            </p>
          </div>
          {refreshing && (
            <span
              className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-200"
              data-tour="settings-sync-badge"
            >
              Sinkronisasi pengaturan...
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/15 border-l-4 border-red-500 rounded-lg shadow-lg" data-tour="settings-feedback">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/15 border-l-4 border-green-500 rounded-lg shadow-lg" data-tour="settings-feedback">
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}

        <div className="space-y-6" data-tour="settings-form">
          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60" data-tour="settings-store-section">
            <h2 className="text-white font-bold text-lg mb-4">Informasi Toko</h2>
            <div className="space-y-5">
              <div data-tour="settings-store-name-field">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-slate-400 text-sm font-medium">Nama Toko (Sidebar Admin)</label>
                  <span className="text-xs text-slate-500">{(settings.store_name || '').length}/50</span>
                </div>
                <input
                  type="text"
                  value={settings.store_name || ''}
                  onChange={(e) => handleInputChange('store_name', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all ${
                    fieldErrors.store_name ? 'border-red-500/50 focus:border-red-500/70' : 'border-slate-600/50 focus:border-orange-500/50'
                  }`}
                  placeholder="Contoh: Sultan Kebab"
                />
                {fieldErrors.store_name && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.store_name}</p>}
              </div>

              <div data-tour="settings-browser-title-field">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-slate-400 text-sm font-medium">Judul Tab Browser (teks di samping favicon)</label>
                  <span className="text-xs text-slate-500">{(settings.browser_title || '').length}/60</span>
                </div>
                <input
                  type="text"
                  value={settings.browser_title || ''}
                  onChange={(e) => handleInputChange('browser_title', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all ${
                    fieldErrors.browser_title ? 'border-red-500/50 focus:border-red-500/70' : 'border-slate-600/50 focus:border-orange-500/50'
                  }`}
                  placeholder="Contoh: Sultan Kebab POS"
                />
                {fieldErrors.browser_title && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.browser_title}</p>}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60" data-tour="settings-branding-section">
            <h2 className="text-white font-bold text-lg mb-4">Branding</h2>
            <div className="space-y-5">
              <div data-tour="settings-logo-field">
                <label className="block text-slate-400 text-sm font-medium mb-2">Logo Toko</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept={acceptFromExtensions(BRAND_IMAGE_EXTENSIONS)}
                      onChange={(e) => handleImageSelect(e, 'logo_url', setLogoFile, setLogoPreview)}
                      className={`w-full px-4 py-2.5 bg-slate-700/50 border rounded-lg text-slate-400 focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-500 file:text-white file:cursor-pointer file:font-medium ${
                        fieldErrors.logo_url ? 'border-red-500/50 focus:border-red-500/70' : 'border-slate-600/50 focus:border-orange-500/50'
                      }`}
                    />
                    {fieldErrors.logo_url && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.logo_url}</p>}
                  </div>
                  {(logoPreview || settings.logo_url) && (
                    <div className="w-20 h-20 rounded-lg border border-slate-600/50 flex items-center justify-center bg-slate-700/30 overflow-hidden">
                      <img
                        src={logoPreview || resolveAssetUrl(settings.logo_url)}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/images/assets/logo.png';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div data-tour="settings-favicon-field">
                <label className="block text-slate-400 text-sm font-medium mb-2">Favicon</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept={acceptFromExtensions(BRAND_IMAGE_EXTENSIONS)}
                      onChange={(e) => handleImageSelect(e, 'favicon_url', setFaviconFile, setFaviconPreview)}
                      className={`w-full px-4 py-2.5 bg-slate-700/50 border rounded-lg text-slate-400 focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-500 file:text-white file:cursor-pointer file:font-medium ${
                        fieldErrors.favicon_url ? 'border-red-500/50 focus:border-red-500/70' : 'border-slate-600/50 focus:border-orange-500/50'
                      }`}
                    />
                    {fieldErrors.favicon_url && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.favicon_url}</p>}
                  </div>
                  {(faviconPreview || settings.favicon_url) && (
                    <div className="w-20 h-20 rounded-lg border border-slate-600/50 flex items-center justify-center bg-slate-700/30 overflow-hidden">
                      <img
                        src={faviconPreview || resolveAssetUrl(settings.favicon_url)}
                        alt="Favicon"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/images/assets/logo.png';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60" data-tour="settings-theme-section">
            <h2 className="text-white font-bold text-lg mb-1">Tema Warna</h2>
            <p className="text-slate-400 text-sm mb-4">
              Total warna tema saat ini: <span className="text-white font-semibold">{THEME_FIELDS.length}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-tour="settings-theme-grid">
              {THEME_FIELDS.map((field) => (
                <div
                  key={field.key}
                  data-tour={field.key === 'gold' ? 'settings-theme-primary-field' : undefined}
                >
                  <label className="block text-slate-400 text-sm font-medium mb-2">{field.label}</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={settings[field.key] || field.fallback}
                      onChange={(e) => handleColorChange(field.key, e.target.value)}
                      className="w-full h-12 rounded-lg cursor-pointer border border-slate-600/50"
                    />
                    <span className="text-slate-400 text-sm font-mono min-w-28 bg-slate-700/50 px-2 py-1 rounded">
                      {settings[field.key] || field.fallback}
                    </span>
                  </div>
                  {fieldErrors[field.key] && <p className="text-red-400 text-xs mt-1.5">{fieldErrors[field.key]}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3" data-tour="settings-actions">
            <button
              onClick={handleSaveSettings}
              disabled={saving || hasFieldError}
              data-tour="settings-save-button"
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${
                saving || hasFieldError ? 'bg-orange-500/50 text-white/70 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>

        <div data-tour="settings-favicon-debugger">
          <FaviconDebugger />
        </div>
      </div>
    </AdminLayout>
  );
}
