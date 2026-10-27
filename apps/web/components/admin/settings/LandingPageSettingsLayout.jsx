'use client';

import { useEffect, useMemo, useState } from 'react';
import HeaderSettings from './HeaderSettings';
import HeroSettings from './HeroSettings';
import MarqueeSettings from './MarqueeSettings';
import AboutSettings from './AboutSettings';
import BestsellersSettings from './BestsellersSettings';
import MenuTabsSettings from './MenuTabsSettings';
import ExperienceSettings from './ExperienceSettings';
import GallerySettings from './GallerySettings';
import LocationsSettings from './LocationsSettings';
import TestimonialsSettings from './TestimonialsSettings';
import CTASettings from './CTASettings';
import FooterSettings from './FooterSettings';
import FloatButtonSettings from './FloatButtonSettings';
import LandingPageFullPreview from '../preview/LandingPageFullPreview';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';
import { SettingsPageSkeleton } from '@/components/ui/SectionSkeleton';
import VisibilityToggle from '../form/VisibilityToggle';

const SETTINGS_SECTIONS = [
  { id: 'header', title: 'Header', component: HeaderSettings },
  { id: 'hero', title: 'Hero Section', component: HeroSettings },
  { id: 'marquee', title: 'Marquee Section', component: MarqueeSettings },
  { id: 'about', title: 'About Section', component: AboutSettings },
  { id: 'bestsellers', title: 'Bestsellers Section', component: BestsellersSettings },
  { id: 'menuTabs', title: 'Menu Tabs Section', component: MenuTabsSettings },
  { id: 'experience', title: 'Experience Section', component: ExperienceSettings },
  { id: 'gallery', title: 'Gallery Section', component: GallerySettings },
  { id: 'locations', title: 'Locations Section', component: LocationsSettings },
  { id: 'testimonials', title: 'Testimonials Section', component: TestimonialsSettings },
  { id: 'cta', title: 'CTA Section', component: CTASettings },
  { id: 'footer', title: 'Footer Section', component: FooterSettings },
  { id: 'floatButton', title: 'Float Button Section', component: FloatButtonSettings },
];

export default function LandingPageSettingsLayout() {
  const [expandedSection, setExpandedSection] = useState('header');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  const {
    settings,
    isDirty,
    isSaving,
    isLoading,
    saveError,
    loadError,
    lastSavedAt,
    hasLoaded,
    saveSettings,
    loadSettings,
    resetSettings,
    updateNestedSetting,
  } = useLandingSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const currentSection = useMemo(
    () => SETTINGS_SECTIONS.find((s) => s.id === expandedSection),
    [expandedSection],
  );
  const SettingsComponent = currentSection?.component;

  const handleSave = async () => {
    await saveSettings();
  };

  const showInitialSkeleton = isLoading && !hasLoaded;

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-[1700px] mx-auto">
        <div data-tour="landing-settings-header" className="mb-6">
          <h1 className="text-3xl font-bold text-cream mb-2">Landing Page Settings</h1>
          <p className="text-slate-400">Kelola semua 13 section landing page dengan preview lengkap.</p>
        </div>

        {showInitialSkeleton && (
          <div className="mb-6">
            <SettingsPageSkeleton sections={SETTINGS_SECTIONS.length} />
          </div>
        )}

        {showInitialSkeleton ? null : (
          <>

        {(loadError || saveError) && (
          <div className="mb-5 px-4 py-3 rounded border border-red-700 bg-red-950/40 text-red-200 text-sm">
            {loadError || saveError}
          </div>
        )}

        <div data-tour="landing-settings-actions" className="flex flex-wrap gap-3 mb-6">
          <button
            data-tour="landing-save-button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="px-4 py-2 bg-yellow-500 text-slate-950 font-semibold rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            data-tour="landing-reset-button"
            onClick={resetSettings}
            disabled={!isDirty || isSaving}
            className="px-4 py-2 bg-slate-800 text-cream border border-slate-600 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Reset
          </button>
          <button
            data-tour="landing-fullscreen-button"
            onClick={() => setIsPreviewFullscreen(true)}
            className="px-4 py-2 bg-slate-800 text-cream border border-slate-600 rounded hover:bg-slate-700 transition"
          >
            Full Screen Preview
          </button>
          {isLoading && hasLoaded && (
            <div className="flex items-center rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-sm font-semibold text-sky-200">
              Sinkronisasi landing page...
            </div>
          )}
          {!isLoading && isDirty && <div className="flex items-center text-yellow-400 text-sm">Unsaved changes</div>}
          {!isDirty && lastSavedAt && (
            <div className="flex items-center text-emerald-400 text-sm">
              Saved at {new Date(lastSavedAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        <div data-tour="landing-workspace" className="grid grid-cols-1 xl:grid-cols-[560px_minmax(0,1fr)] gap-6">
          <div data-tour="landing-section-form-panel" className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-cream">Section Form</h2>
              <select
                data-tour="landing-section-select"
                value={expandedSection}
                onChange={(e) => setExpandedSection(e.target.value)}
                className="bg-slate-800 text-cream px-3 py-2 rounded border border-slate-600 text-sm"
              >
                {SETTINGS_SECTIONS.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>

            {SettingsComponent && (
              <div className="space-y-4">
                <div data-tour="landing-visibility-toggle">
                  <VisibilityToggle
                    enabled={settings?.[expandedSection]?.enabled}
                    onChange={(value) => updateNestedSetting(expandedSection, 'enabled', value)}
                    title={`${currentSection?.title || 'Section'} aktif`}
                    description="Nonaktifkan jika section ini tidak ingin ditampilkan di landing page dan preview publik."
                  />
                </div>
                <div data-tour="landing-active-section-form" data-active-section={expandedSection}>
                  <SettingsComponent />
                </div>
              </div>
            )}
          </div>

          <div data-tour="landing-preview-panel" className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-semibold text-cream">Full Landing Preview</h2>
              <span className="text-xs text-slate-400">
                Highlight: {currentSection?.title || '-'}
              </span>
            </div>
            <div data-tour="landing-preview-frame" className="h-[78vh] overflow-y-auto rounded border border-slate-700">
              <LandingPageFullPreview settings={settings} highlightedSection={expandedSection} />
            </div>
          </div>
        </div>

        <div data-tour="landing-all-sections" className="mt-10 bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-cream mb-6">All Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                data-tour="landing-section-card"
                onClick={() => setExpandedSection(section.id)}
                className={`text-left px-4 py-3 rounded transition ${
                  expandedSection === section.id
                    ? 'bg-yellow-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-cream hover:bg-slate-700'
                }`}
              >
                {section.title}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  settings?.[section.id]?.enabled === false
                    ? 'bg-rose-500/15 text-rose-200'
                    : expandedSection === section.id
                      ? 'bg-slate-950/15 text-slate-950'
                      : 'bg-emerald-500/15 text-emerald-200'
                }`}>
                  {settings?.[section.id]?.enabled === false ? 'Nonaktif' : 'Aktif'}
                </span>
              </button>
            ))}
          </div>
        </div>
          </>
        )}
      </div>

      {isPreviewFullscreen && (
        <div data-tour="landing-fullscreen-modal" className="fixed inset-0 z-[9999] bg-black/85 p-4 md:p-6">
          <div className="h-full max-w-[1800px] mx-auto bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="text-cream font-semibold">Landing Page Full Screen Preview</h3>
              <button
                onClick={() => setIsPreviewFullscreen(false)}
                className="px-3 py-1.5 text-sm bg-slate-800 text-cream rounded border border-slate-600 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-56px)] overflow-y-auto">
              <LandingPageFullPreview settings={settings} highlightedSection={expandedSection} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
