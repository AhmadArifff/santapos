'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import TextArea from '../form/TextArea';
import ImageUpload from '../form/ImageUpload';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function TestimonialsSettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const testimonialsSettings = settings.testimonials || {};
  const items = testimonialsSettings.items || [];

  return (
    <div className="space-y-6">
      <AccordionSection title="Section Content" defaultOpen={true}>
        <TextInput
          label="Section Label"
          value={testimonialsSettings.sectionLabel}
          onChange={(val) => updateNestedSetting('testimonials', 'sectionLabel', val)}
          maxLength={60}
        />
        <TextInput
          label="Title"
          value={testimonialsSettings.title}
          onChange={(val) => updateNestedSetting('testimonials', 'title', val)}
          maxLength={120}
        />
        <TextInput
          label="Highlight"
          value={testimonialsSettings.highlight}
          onChange={(val) => updateNestedSetting('testimonials', 'highlight', val)}
          maxLength={60}
        />
        <TextArea
          label="Description"
          value={testimonialsSettings.description}
          onChange={(val) => updateNestedSetting('testimonials', 'description', val)}
          rows={4}
          maxLength={360}
        />
      </AccordionSection>

      <AccordionSection title="Testimonial Items">
        <DynamicArray
          items={items}
          label="Cards"
          onAdd={() =>
            addArrayItem('testimonials', 'items', {
              id: Date.now(),
              ariaLabel: 'Review Pelanggan',
              image: '',
              imageAlt: 'Pelanggan',
              badge: '',
              review: 'Review pelanggan...',
              authorAvatar: '',
              authorAvatarAlt: 'Avatar',
              author: 'Nama Pelanggan',
              role: 'Role',
              revealClass: '',
            })
          }
          onRemove={(idx) => removeArrayItem('testimonials', 'items', idx)}
          renderItem={(item, idx) => (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="ID"
                  value={item.id}
                  onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.id`, val)}
                />
                <TextInput
                  label="Reveal Class"
                  value={item.revealClass}
                  onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.revealClass`, val)}
                  placeholder="reveal-delay-1"
                />
              </div>
              <TextInput
                label="Aria Label"
                value={item.ariaLabel}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.ariaLabel`, val)}
                maxLength={120}
              />
              <ImageUpload
                label="Background Image"
                value={item.image}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.image`, val)}
              />
              <TextInput
                label="Background Image Alt"
                value={item.imageAlt}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.imageAlt`, val)}
                maxLength={120}
              />
              <TextInput
                label="Badge"
                value={item.badge}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.badge`, val)}
                maxLength={40}
              />
              <TextArea
                label="Review Text"
                value={item.review}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.review`, val)}
                rows={4}
                maxLength={500}
              />
              <ImageUpload
                label="Author Avatar"
                value={item.authorAvatar}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.authorAvatar`, val)}
              />
              <TextInput
                label="Author Avatar Alt"
                value={item.authorAvatarAlt}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.authorAvatarAlt`, val)}
                maxLength={80}
              />
              <TextInput
                label="Author Name"
                value={item.author}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.author`, val)}
                maxLength={80}
              />
              <TextInput
                label="Author Role"
                value={item.role}
                onChange={(val) => updateNestedSetting('testimonials', `items.${idx}.role`, val)}
                maxLength={120}
              />
            </div>
          )}
          addButtonLabel="+ Add Testimonial"
          maxItems={12}
        />
      </AccordionSection>
    </div>
  );
}
