'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import ImageUpload from '../form/ImageUpload';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function GallerySettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const gallerySettings = settings.gallery || {};
  const images = gallerySettings.images || [];

  return (
    <div className="space-y-6">
      <AccordionSection title="Gallery Images" defaultOpen={true}>
        <DynamicArray
          items={images}
          label="Images"
          onAdd={() =>
            addArrayItem('gallery', 'images', {
              id: Date.now(),
              image: '',
              alt: 'Gallery Image',
            })
          }
          onRemove={(idx) => removeArrayItem('gallery', 'images', idx)}
          renderItem={(imageItem, idx) => (
            <div className="space-y-2">
              <TextInput
                label="Image ID"
                value={imageItem.id}
                onChange={(val) => updateNestedSetting('gallery', `images.${idx}.id`, val)}
              />
              <ImageUpload
                label="Image URL"
                value={imageItem.image}
                onChange={(val) => updateNestedSetting('gallery', `images.${idx}.image`, val)}
              />
              <TextInput
                label="Alt Text"
                value={imageItem.alt}
                onChange={(val) => updateNestedSetting('gallery', `images.${idx}.alt`, val)}
                maxLength={80}
              />
            </div>
          )}
          addButtonLabel="+ Add Image"
          maxItems={20}
        />
      </AccordionSection>
    </div>
  );
}
