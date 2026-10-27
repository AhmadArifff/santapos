'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function MarqueeSettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const marqueeSettings = settings.marquee || {};
  const items = marqueeSettings.items || [];

  return (
    <div className="space-y-6">
      <AccordionSection title="Marquee Content" defaultOpen={true}>
        <TextInput
          label="Dot Separator"
          value={marqueeSettings.dot}
          onChange={(val) => updateNestedSetting('marquee', 'dot', val)}
          maxLength={5}
          placeholder="e.g., *"
        />
      </AccordionSection>

      <AccordionSection title="Marquee Items">
        <DynamicArray
          items={items}
          label="Items"
          onAdd={() => addArrayItem('marquee', 'items', 'NEW ITEM')}
          onRemove={(idx) => removeArrayItem('marquee', 'items', idx)}
          renderItem={(item, idx) => (
            <TextInput
              label={`Item ${idx + 1}`}
              value={item}
              onChange={(val) => updateNestedSetting('marquee', `items.${idx}`, val)}
              maxLength={80}
              placeholder="e.g., AUTHENTIC HALAL"
            />
          )}
          addButtonLabel="+ Add Marquee Item"
          maxItems={20}
        />
      </AccordionSection>
    </div>
  );
}
