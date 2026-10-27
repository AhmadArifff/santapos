'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function HeaderSettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const headerSettings = settings.header || {};
  const logo = headerSettings.logo || {};
  const navLinks = headerSettings.navLinks || [];
  const buttons = headerSettings.buttons || {};

  return (
    <div className="space-y-6">
      <AccordionSection title="Logo" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Logo Part 1"
            value={logo.part1}
            onChange={(val) => updateNestedSetting('header', 'logo.part1', val)}
            maxLength={20}
            placeholder="e.g., SULTAN"
          />
          <TextInput
            label="Logo Part 2"
            value={logo.part2}
            onChange={(val) => updateNestedSetting('header', 'logo.part2', val)}
            maxLength={20}
            placeholder="e.g., KEBAB"
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Navigation Links">
        <DynamicArray
          items={navLinks}
          label="Navigation Links"
          onAdd={() =>
            addArrayItem('header', 'navLinks', {
              label: 'New Link',
              href: '#section',
            })
          }
          onRemove={(idx) => removeArrayItem('header', 'navLinks', idx)}
          renderItem={(item, idx) => (
            <div className="space-y-2">
              <TextInput
                label="Label"
                value={item.label}
                onChange={(val) =>
                  updateNestedSetting('header', `navLinks.${idx}.label`, val)
                }
                maxLength={50}
              />
              <TextInput
                label="Link (href)"
                value={item.href}
                onChange={(val) =>
                  updateNestedSetting('header', `navLinks.${idx}.href`, val)
                }
                maxLength={100}
              />
            </div>
          )}
          addButtonLabel="+ Add Navigation Link"
        />
      </AccordionSection>

      <AccordionSection title="Buttons">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-cream mb-3">CTA Button (Order Now)</h4>
            <div className="space-y-2">
              <TextInput
                label="Label"
                value={buttons.cta?.label}
                onChange={(val) =>
                  updateNestedSetting('header', 'buttons.cta.label', val)
                }
                maxLength={30}
              />
              <TextInput
                label="URL"
                value={buttons.cta?.href}
                onChange={(val) =>
                  updateNestedSetting('header', 'buttons.cta.href', val)
                }
                type="url"
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-cream mb-3">Admin Login Button</h4>
            <div className="space-y-2">
              <TextInput
                label="Label"
                value={buttons.admin?.label}
                onChange={(val) =>
                  updateNestedSetting('header', 'buttons.admin.label', val)
                }
                maxLength={30}
              />
              <TextInput
                label="URL"
                value={buttons.admin?.href}
                onChange={(val) =>
                  updateNestedSetting('header', 'buttons.admin.href', val)
                }
              />
            </div>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}
