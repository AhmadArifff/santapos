'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function FloatButtonSettings() {
  const { settings, updateNestedSetting } = useLandingSettingsStore();
  const floatSettings = settings.floatButton || {};

  return (
    <div className="space-y-6">
      <AccordionSection title="Float Button" defaultOpen={true}>
        <TextInput
          label="Button URL"
          value={floatSettings.href}
          onChange={(val) => updateNestedSetting('floatButton', 'href', val)}
        />
        <TextInput
          label="Icon / Text"
          value={floatSettings.icon}
          onChange={(val) => updateNestedSetting('floatButton', 'icon', val)}
          maxLength={20}
          placeholder="Chat"
        />
        <TextInput
          label="Aria Label"
          value={floatSettings.ariaLabel}
          onChange={(val) => updateNestedSetting('floatButton', 'ariaLabel', val)}
          maxLength={120}
        />
      </AccordionSection>
    </div>
  );
}
