'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import TextArea from '../form/TextArea';
import ImageUpload from '../form/ImageUpload';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function AboutSettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const aboutSettings = settings.about || {};
  const features = aboutSettings.features || [];

  return (
    <div className="space-y-6">
      <AccordionSection title="Section Content" defaultOpen={true}>
        <TextInput
          label="Section Label"
          value={aboutSettings.sectionLabel}
          onChange={(val) => updateNestedSetting('about', 'sectionLabel', val)}
          maxLength={60}
          placeholder="e.g., Tentang Kami"
        />
        <TextInput
          label="Title"
          value={aboutSettings.title}
          onChange={(val) => updateNestedSetting('about', 'title', val)}
          maxLength={120}
          placeholder="e.g., Warisan Rasa Otentik Timur Tengah"
        />
        <TextInput
          label="Highlight Text"
          value={aboutSettings.highlight}
          onChange={(val) => updateNestedSetting('about', 'highlight', val)}
          maxLength={40}
          placeholder="e.g., Otentik"
        />
        <TextArea
          label="Description"
          value={aboutSettings.description}
          onChange={(val) => updateNestedSetting('about', 'description', val)}
          rows={4}
          maxLength={400}
        />
      </AccordionSection>

      <AccordionSection title="Images">
        <ImageUpload
          label="Main Image"
          value={aboutSettings.mainImage}
          onChange={(val) => updateNestedSetting('about', 'mainImage', val)}
        />
        <ImageUpload
          label="Accent Image"
          value={aboutSettings.accentImage}
          onChange={(val) => updateNestedSetting('about', 'accentImage', val)}
        />
      </AccordionSection>

      <AccordionSection title="Badge">
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Badge Top"
            value={aboutSettings.badgeTop}
            onChange={(val) => updateNestedSetting('about', 'badgeTop', val)}
            maxLength={20}
            placeholder="e.g., 9+"
          />
          <TextInput
            label="Badge Bottom"
            value={aboutSettings.badgeBottom}
            onChange={(val) => updateNestedSetting('about', 'badgeBottom', val)}
            maxLength={40}
            placeholder="e.g., Tahun Berdiri"
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Features">
        <DynamicArray
          items={features}
          label="Feature List"
          onAdd={() =>
            addArrayItem('about', 'features', {
              icon: '*',
              title: 'Fitur Baru',
              description: 'Deskripsi fitur baru',
            })
          }
          onRemove={(idx) => removeArrayItem('about', 'features', idx)}
          renderItem={(item, idx) => (
            <div className="space-y-2">
              <TextInput
                label="Icon"
                value={item.icon}
                onChange={(val) => updateNestedSetting('about', `features.${idx}.icon`, val)}
                maxLength={6}
                placeholder="e.g., *"
              />
              <TextInput
                label="Title"
                value={item.title}
                onChange={(val) => updateNestedSetting('about', `features.${idx}.title`, val)}
                maxLength={80}
              />
              <TextArea
                label="Description"
                value={item.description}
                onChange={(val) => updateNestedSetting('about', `features.${idx}.description`, val)}
                rows={3}
                maxLength={240}
              />
            </div>
          )}
          addButtonLabel="+ Add Feature"
          maxItems={8}
        />
      </AccordionSection>
    </div>
  );
}
