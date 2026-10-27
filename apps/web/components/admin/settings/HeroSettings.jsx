'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import TextArea from '../form/TextArea';
import ImageUpload from '../form/ImageUpload';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function HeroSettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const heroSettings = settings.hero || {};
  const title = heroSettings.title || {};
  const buttons = heroSettings.buttons || {};
  const stats = heroSettings.stats || [];

  return (
    <div className="space-y-6">
      <AccordionSection title="Background" defaultOpen={true}>
        <ImageUpload
          label="Background Image"
          value={heroSettings.backgroundImage}
          onChange={(val) => updateNestedSetting('hero', 'backgroundImage', val)}
          required
        />
      </AccordionSection>

      <AccordionSection title="Content">
        <TextInput
          label="Badge Text"
          value={heroSettings.badge}
          onChange={(val) => updateNestedSetting('hero', 'badge', val)}
          maxLength={100}
          placeholder="e.g., Authentic Middle Eastern Cuisine Since 2015"
        />

        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-medium text-cream">Title (3 parts)</h4>
          <TextInput
            label="Part 1"
            value={title.part1}
            onChange={(val) => updateNestedSetting('hero', 'title.part1', val)}
            maxLength={50}
          />
          <TextInput
            label="Part 2 (Accent/Highlight)"
            value={title.part2}
            onChange={(val) => updateNestedSetting('hero', 'title.part2', val)}
            maxLength={50}
          />
          <TextInput
            label="Part 3"
            value={title.part3}
            onChange={(val) => updateNestedSetting('hero', 'title.part3', val)}
            maxLength={50}
          />
        </div>

        <TextArea
          label="Subtitle"
          value={heroSettings.subtitle}
          onChange={(val) => updateNestedSetting('hero', 'subtitle', val)}
          maxLength={300}
          rows={3}
          className="mt-4"
        />
      </AccordionSection>

      <AccordionSection title="Buttons">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-cream mb-3">Primary Button</h4>
            <div className="space-y-2">
              <TextInput
                label="Label"
                value={buttons.primary?.label}
                onChange={(val) => updateNestedSetting('hero', 'buttons.primary.label', val)}
                maxLength={30}
              />
              <TextInput
                label="Link"
                value={buttons.primary?.href}
                onChange={(val) => updateNestedSetting('hero', 'buttons.primary.href', val)}
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-cream mb-3">Secondary Button</h4>
            <div className="space-y-2">
              <TextInput
                label="Label"
                value={buttons.secondary?.label}
                onChange={(val) => updateNestedSetting('hero', 'buttons.secondary.label', val)}
                maxLength={30}
              />
              <TextInput
                label="Link"
                value={buttons.secondary?.href}
                onChange={(val) => updateNestedSetting('hero', 'buttons.secondary.href', val)}
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Statistics">
        <DynamicArray
          items={stats}
          label="Hero Statistics"
          onAdd={() =>
            addArrayItem('hero', 'stats', {
              value: 0,
              suffix: '+',
              label: 'Label',
            })
          }
          onRemove={(idx) => removeArrayItem('hero', 'stats', idx)}
          renderItem={(item, idx) => (
            <div className="space-y-2">
              <TextInput
                label="Value"
                value={item.value}
                onChange={(val) =>
                  updateNestedSetting('hero', `stats.${idx}.value`, val)
                }
                placeholder="e.g., 12"
              />
              <TextInput
                label="Suffix"
                value={item.suffix}
                onChange={(val) =>
                  updateNestedSetting('hero', `stats.${idx}.suffix`, val)
                }
                maxLength={5}
                placeholder="e.g., +"
              />
              <TextInput
                label="Label"
                value={item.label}
                onChange={(val) =>
                  updateNestedSetting('hero', `stats.${idx}.label`, val)
                }
                maxLength={20}
                placeholder="e.g., Cabang"
              />
            </div>
          )}
          addButtonLabel="+ Add Statistic"
          maxItems={5}
        />
      </AccordionSection>
    </div>
  );
}
