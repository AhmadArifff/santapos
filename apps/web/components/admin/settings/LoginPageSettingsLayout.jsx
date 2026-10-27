'use client';

import { useEffect } from 'react';
import AccordionSection from '../form/AccordionSection';
import DynamicArray from '../form/DynamicArray';
import ImageUpload from '../form/ImageUpload';
import TextArea from '../form/TextArea';
import TextInput from '../form/TextInput';
import VisibilityToggle from '../form/VisibilityToggle';
import { useLoginPageSettingsStore } from '@/store/loginSettingsStore';
import { SettingsPageSkeleton } from '@/components/ui/SectionSkeleton';

export default function LoginPageSettingsLayout() {
  const {
    settings,
    isDirty,
    isSaving,
    isLoading,
    loadError,
    saveError,
    lastSavedAt,
    hasLoaded,
    loadSettings,
    saveSettings,
    resetSettings,
    updateNestedSetting,
  } = useLoginPageSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const stats = settings.hero?.stats || [];
  const floatingImages = settings.media?.floatingImages || [];
  const showInitialSkeleton = isLoading && !hasLoaded;

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-[1500px] mx-auto">
        <div data-tour="login-settings-header" className="mb-6">
          <h1 className="text-3xl font-bold text-cream mb-2">Login Page Settings</h1>
          <p className="text-slate-400">
            Kelola text dan gambar halaman login. Default mengikuti tampilan saat ini, lalu otomatis memakai data database jika tersedia.
          </p>
        </div>

        {showInitialSkeleton && (
          <div className="mb-6">
            <SettingsPageSkeleton sections={6} />
          </div>
        )}

        {showInitialSkeleton ? null : (
          <>

        {(loadError || saveError) && (
          <div className="mb-5 px-4 py-3 rounded border border-red-700 bg-red-950/40 text-red-200 text-sm">
            {loadError || saveError}
          </div>
        )}

        <div data-tour="login-settings-actions" className="flex flex-wrap gap-3 mb-6">
          <button
            data-tour="login-save-button"
            onClick={saveSettings}
            disabled={!isDirty || isSaving}
            className="px-4 py-2 bg-yellow-500 text-slate-950 font-semibold rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            data-tour="login-reset-button"
            onClick={resetSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-800 text-cream border border-slate-600 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Reset to Default
          </button>
          {isLoading && hasLoaded && (
            <div className="flex items-center rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-sm font-semibold text-sky-200">
              Sinkronisasi login page...
            </div>
          )}
          {!isLoading && isDirty && <div className="flex items-center text-yellow-400 text-sm">Unsaved changes</div>}
          {!isDirty && lastSavedAt && (
            <div className="flex items-center text-emerald-400 text-sm">
              Saved at {new Date(lastSavedAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        <div data-tour="login-settings-workspace" className="grid grid-cols-1 xl:grid-cols-[620px_minmax(0,1fr)] gap-6">
          <div data-tour="login-settings-form-panel" className="bg-slate-900 rounded-lg p-6 border border-slate-800 space-y-4">
            <div data-tour="login-hero-images-section">
            <AccordionSection title="Hero Images" defaultOpen>
              <div data-tour="login-media-toggle">
              <VisibilityToggle
                enabled={settings.media?.enabled}
                onChange={(value) => updateNestedSetting('media.enabled', value)}
                title="Hero images aktif"
                description="Nonaktifkan untuk menyembunyikan background dan floating image di login page."
              />
              </div>
              <div data-tour="login-background-image-field">
              <ImageUpload
                label="Background Image"
                value={settings.media?.backgroundImage}
                onChange={(value) => updateNestedSetting('media.backgroundImage', value)}
              />
              </div>

              <div data-tour="login-floating-images-field">
              <DynamicArray
                label="Floating Images"
                items={floatingImages}
                maxItems={4}
                onAdd={() =>
                  updateNestedSetting('media.floatingImages', [
                    ...floatingImages,
                    { src: '', alt: 'Login image' },
                  ])
                }
                onRemove={(index) =>
                  updateNestedSetting(
                    'media.floatingImages',
                    floatingImages.filter((_, idx) => idx !== index),
                  )
                }
                renderItem={(item, index) => (
                  <div className="space-y-3">
                    <ImageUpload
                      label={`Image ${index + 1}`}
                      value={item.src}
                      onChange={(value) => {
                        const next = [...floatingImages];
                        next[index] = { ...next[index], src: value };
                        updateNestedSetting('media.floatingImages', next);
                      }}
                    />
                    <TextInput
                      label="Alt Text"
                      value={item.alt}
                      onChange={(value) => {
                        const next = [...floatingImages];
                        next[index] = { ...next[index], alt: value };
                        updateNestedSetting('media.floatingImages', next);
                      }}
                      maxLength={50}
                    />
                  </div>
                )}
                addButtonLabel="+ Add Floating Image"
              />
              </div>
            </AccordionSection>
            </div>

            <div data-tour="login-hero-text-section">
            <AccordionSection title="Hero Text">
              <div data-tour="login-hero-toggle">
              <VisibilityToggle
                enabled={settings.hero?.enabled}
                onChange={(value) => updateNestedSetting('hero.enabled', value)}
                title="Hero text aktif"
                description="Nonaktifkan untuk menyembunyikan badge, judul, deskripsi, dan statistik di panel kiri login page."
              />
              </div>
              <div data-tour="login-hero-badge-field">
              <TextInput
                label="Badge Text"
                value={settings.hero?.badge}
                onChange={(value) => updateNestedSetting('hero.badge', value)}
                maxLength={80}
              />
              </div>
              <div data-tour="login-hero-title-fields">
              <TextInput
                label="Title Line 1"
                value={settings.hero?.titleTop}
                onChange={(value) => updateNestedSetting('hero.titleTop', value)}
                maxLength={60}
              />
              <TextInput
                label="Title Accent"
                value={settings.hero?.titleAccent}
                onChange={(value) => updateNestedSetting('hero.titleAccent', value)}
                maxLength={60}
              />
              </div>
              <div data-tour="login-hero-description-field">
              <TextArea
                label="Description"
                value={settings.hero?.description}
                onChange={(value) => updateNestedSetting('hero.description', value)}
                rows={3}
                maxLength={240}
              />
              </div>

              <div data-tour="login-hero-stats-field">
              <DynamicArray
                label="Stats"
                items={stats}
                maxItems={4}
                onAdd={() => updateNestedSetting('hero.stats', [...stats, { value: '0', label: 'Label' }])}
                onRemove={(index) => updateNestedSetting('hero.stats', stats.filter((_, idx) => idx !== index))}
                renderItem={(item, index) => (
                  <div className="space-y-2">
                    <TextInput
                      label="Value"
                      value={item.value}
                      onChange={(value) => {
                        const next = [...stats];
                        next[index] = { ...next[index], value };
                        updateNestedSetting('hero.stats', next);
                      }}
                      maxLength={16}
                    />
                    <TextInput
                      label="Label"
                      value={item.label}
                      onChange={(value) => {
                        const next = [...stats];
                        next[index] = { ...next[index], label: value };
                        updateNestedSetting('hero.stats', next);
                      }}
                      maxLength={24}
                    />
                  </div>
                )}
                addButtonLabel="+ Add Stat"
              />
              </div>
            </AccordionSection>
            </div>

            <div data-tour="login-brand-form-section">
            <AccordionSection title="Brand & Form Text">
              <div data-tour="login-brand-toggle">
              <VisibilityToggle
                enabled={settings.brand?.enabled}
                onChange={(value) => updateNestedSetting('brand.enabled', value)}
                title="Brand header aktif"
                description="Nonaktifkan untuk menyembunyikan logo dan nama toko di atas form login."
              />
              </div>
              <div data-tour="login-form-toggle">
              <VisibilityToggle
                enabled={settings.form?.enabled}
                onChange={(value) => updateNestedSetting('form.enabled', value)}
                title="Form login aktif"
                description="Nonaktifkan hanya jika halaman login sementara tidak ingin menampilkan form masuk."
              />
              </div>
              <div data-tour="login-brand-subtitle-field">
              <TextInput
                label="Brand Subtitle"
                value={settings.brand?.subtitle}
                onChange={(value) => updateNestedSetting('brand.subtitle', value)}
                maxLength={50}
              />
              </div>
              <div data-tour="login-form-title-fields">
              <TextInput
                label="Form Title"
                value={settings.form?.title}
                onChange={(value) => updateNestedSetting('form.title', value)}
                maxLength={40}
              />
              <TextInput
                label="Form Title Accent"
                value={settings.form?.titleAccent}
                onChange={(value) => updateNestedSetting('form.titleAccent', value)}
                maxLength={40}
              />
              </div>
              <div data-tour="login-form-subtitle-field">
              <TextArea
                label="Form Subtitle"
                value={settings.form?.subtitle}
                onChange={(value) => updateNestedSetting('form.subtitle', value)}
                rows={2}
                maxLength={180}
              />
              </div>
              <div data-tour="login-form-input-labels">
              <TextInput label="Email Label" value={settings.form?.emailLabel} onChange={(value) => updateNestedSetting('form.emailLabel', value)} maxLength={30} />
              <TextInput label="Email Placeholder" value={settings.form?.emailPlaceholder} onChange={(value) => updateNestedSetting('form.emailPlaceholder', value)} maxLength={80} />
              <TextInput label="Password Label" value={settings.form?.passwordLabel} onChange={(value) => updateNestedSetting('form.passwordLabel', value)} maxLength={30} />
              <TextInput label="Password Placeholder" value={settings.form?.passwordPlaceholder} onChange={(value) => updateNestedSetting('form.passwordPlaceholder', value)} maxLength={80} />
              <TextInput label="Remember Label" value={settings.form?.rememberLabel} onChange={(value) => updateNestedSetting('form.rememberLabel', value)} maxLength={50} />
              <TextInput label="Forgot Password Label" value={settings.form?.forgotPasswordLabel} onChange={(value) => updateNestedSetting('form.forgotPasswordLabel', value)} maxLength={50} />
              <TextInput label="Submit Button" value={settings.form?.submitLabel} onChange={(value) => updateNestedSetting('form.submitLabel', value)} maxLength={50} />
              <TextInput label="Loading Button" value={settings.form?.loadingLabel} onChange={(value) => updateNestedSetting('form.loadingLabel', value)} maxLength={50} />
              <TextInput label="Divider Text" value={settings.form?.dividerText} onChange={(value) => updateNestedSetting('form.dividerText', value)} maxLength={50} />
              <TextInput label="Back Link Label" value={settings.form?.backLinkLabel} onChange={(value) => updateNestedSetting('form.backLinkLabel', value)} maxLength={70} />
              </div>
            </AccordionSection>
            </div>

            <div data-tour="login-messages-footer-section">
            <AccordionSection title="Messages & Footer">
              <div data-tour="login-footer-toggle">
              <VisibilityToggle
                enabled={settings.footer?.enabled}
                onChange={(value) => updateNestedSetting('footer.enabled', value)}
                title="Footer login aktif"
                description="Nonaktifkan untuk menyembunyikan teks footer dan versi di login page."
              />
              </div>
              <div data-tour="login-toast-fields">
              <TextInput label="Forgot Password Toast" value={settings.form?.forgotPasswordToast} onChange={(value) => updateNestedSetting('form.forgotPasswordToast', value)} maxLength={140} />
              <TextInput label="Success Toast" value={settings.form?.successToast} onChange={(value) => updateNestedSetting('form.successToast', value)} maxLength={100} hint="Gunakan {name} untuk nama user." />
              <TextInput label="Login Error Message" value={settings.form?.errorMessage} onChange={(value) => updateNestedSetting('form.errorMessage', value)} maxLength={120} />
              </div>
              <div data-tour="login-validation-fields">
              <TextInput label="Email Required" value={settings.validation?.emailRequired} onChange={(value) => updateNestedSetting('validation.emailRequired', value)} maxLength={80} />
              <TextInput label="Email Invalid" value={settings.validation?.emailInvalid} onChange={(value) => updateNestedSetting('validation.emailInvalid', value)} maxLength={80} />
              <TextInput label="Password Required" value={settings.validation?.passwordRequired} onChange={(value) => updateNestedSetting('validation.passwordRequired', value)} maxLength={80} />
              <TextInput label="Password Min Length" value={settings.validation?.passwordMinLength} onChange={(value) => updateNestedSetting('validation.passwordMinLength', value)} maxLength={80} />
              </div>
              <div data-tour="login-footer-fields">
              <TextInput label="Footer Text" value={settings.footer?.text} onChange={(value) => updateNestedSetting('footer.text', value)} maxLength={100} />
              <TextInput label="Footer Version" value={settings.footer?.version} onChange={(value) => updateNestedSetting('footer.version', value)} maxLength={80} />
              </div>
            </AccordionSection>
            </div>
          </div>

          <div data-tour="login-preview-panel" className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-semibold text-cream">Login Preview</h2>
              <span className="text-xs text-slate-400">Live data preview</span>
            </div>
            <div data-tour="login-preview-frame" className="overflow-hidden rounded border border-slate-700 bg-[#0D0A06]">
              <div className="grid md:grid-cols-2 min-h-[620px]">
                <div data-tour="login-preview-left-panel" className="relative hidden md:flex flex-col justify-end p-8 overflow-hidden">
                  {settings.media?.enabled !== false && settings.media?.backgroundImage && (
                    <img
                      src={settings.media.backgroundImage}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-70"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/90" />
                  {settings.hero?.enabled !== false && (
                  <div className="relative">
                    <div className="inline-flex border border-yellow-500/50 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-yellow-400 mb-5">
                      {settings.hero?.badge}
                    </div>
                    <h3 className="font-serif text-4xl font-black text-cream leading-tight">
                      {settings.hero?.titleTop}
                      <span className="block italic font-normal text-yellow-400">{settings.hero?.titleAccent}</span>
                    </h3>
                    <p className="text-sm text-slate-300 leading-7 mt-4">{settings.hero?.description}</p>
                    <div className="flex gap-6 mt-8">
                      {stats.map((stat, index) => (
                        <div key={`${stat.label}-${index}`}>
                          <span className="block text-2xl font-bold text-yellow-400">{stat.value}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
                <div data-tour="login-preview-form-panel" className="flex items-center justify-center p-8 bg-[#1A1409]">
                  <div className="w-full max-w-sm">
                    {settings.brand?.enabled !== false && (
                      <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 mb-2">{settings.brand?.subtitle}</p>
                    )}
                    {settings.form?.enabled !== false ? (
                      <>
                        <h3 className="font-serif text-3xl text-cream mb-2">
                          {settings.form?.title} <span className="italic text-yellow-400">{settings.form?.titleAccent}</span>
                        </h3>
                        <p className="text-sm text-slate-400 mb-8">{settings.form?.subtitle}</p>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-slate-400">{settings.form?.emailLabel}</label>
                            <div className="mt-2 h-11 rounded border border-yellow-500/20 bg-white/5 px-3 flex items-center text-slate-500 text-sm">
                              {settings.form?.emailPlaceholder}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-slate-400">{settings.form?.passwordLabel}</label>
                            <div className="mt-2 h-11 rounded border border-yellow-500/20 bg-white/5 px-3 flex items-center text-slate-500 text-sm">
                              {settings.form?.passwordPlaceholder}
                            </div>
                          </div>
                          <div className="h-11 rounded bg-yellow-500 text-slate-950 flex items-center justify-center text-xs uppercase tracking-[0.2em] font-bold">
                            {settings.form?.submitLabel}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-300">
                        Form login sedang dinonaktifkan dari pengaturan.
                      </div>
                    )}
                    {settings.footer?.enabled !== false && (
                      <p className="text-center text-xs text-slate-500 leading-6 mt-8">
                        {settings.footer?.text}
                        <br />
                        {settings.footer?.version}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
