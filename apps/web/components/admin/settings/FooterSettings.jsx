'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import TextArea from '../form/TextArea';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function FooterSettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const footerSettings = settings.footer || {};
  const socialLinks = footerSettings.socialLinks || [];
  const columns = footerSettings.columns || [];

  return (
    <div className="space-y-6">
      <AccordionSection title="Brand" defaultOpen={true}>
        <TextInput
          label="Brand Name"
          value={footerSettings.brand}
          onChange={(val) => updateNestedSetting('footer', 'brand', val)}
          maxLength={60}
        />
        <TextArea
          label="Brand Description"
          value={footerSettings.brandDescription}
          onChange={(val) => updateNestedSetting('footer', 'brandDescription', val)}
          rows={3}
          maxLength={260}
        />
      </AccordionSection>

      <AccordionSection title="Social Links">
        <DynamicArray
          items={socialLinks}
          label="Social Items"
          onAdd={() =>
            addArrayItem('footer', 'socialLinks', {
              label: 'New Social',
              href: '#',
              icon: '*',
            })
          }
          onRemove={(idx) => removeArrayItem('footer', 'socialLinks', idx)}
          renderItem={(social, idx) => (
            <div className="space-y-2">
              <TextInput
                label="Label"
                value={social.label}
                onChange={(val) => updateNestedSetting('footer', `socialLinks.${idx}.label`, val)}
                maxLength={40}
              />
              <TextInput
                label="URL"
                value={social.href}
                onChange={(val) => updateNestedSetting('footer', `socialLinks.${idx}.href`, val)}
              />
              <TextInput
                label="Icon Text"
                value={social.icon}
                onChange={(val) => updateNestedSetting('footer', `socialLinks.${idx}.icon`, val)}
                maxLength={12}
              />
            </div>
          )}
          addButtonLabel="+ Add Social"
          maxItems={10}
        />
      </AccordionSection>

      <AccordionSection title="Footer Columns">
        <DynamicArray
          items={columns}
          label="Columns"
          onAdd={() =>
            addArrayItem('footer', 'columns', {
              title: 'Kolom Baru',
              links: [],
            })
          }
          onRemove={(idx) => removeArrayItem('footer', 'columns', idx)}
          renderItem={(column, cIdx) => (
            <div className="space-y-3">
              <TextInput
                label="Column Title"
                value={column.title}
                onChange={(val) => updateNestedSetting('footer', `columns.${cIdx}.title`, val)}
                maxLength={50}
              />
              <DynamicArray
                items={column.links || []}
                label="Links"
                onAdd={() =>
                  addArrayItem('footer', `columns.${cIdx}.links`, {
                    label: 'Link Baru',
                    href: '#',
                  })
                }
                onRemove={(lIdx) => removeArrayItem('footer', `columns.${cIdx}.links`, lIdx)}
                renderItem={(link, lIdx) => (
                  <div className="space-y-2">
                    <TextInput
                      label="Link Label"
                      value={link.label}
                      onChange={(val) => updateNestedSetting('footer', `columns.${cIdx}.links.${lIdx}.label`, val)}
                      maxLength={80}
                    />
                    <TextInput
                      label="Link Href"
                      value={link.href}
                      onChange={(val) => updateNestedSetting('footer', `columns.${cIdx}.links.${lIdx}.href`, val)}
                    />
                  </div>
                )}
                addButtonLabel="+ Add Link"
                maxItems={20}
              />
            </div>
          )}
          addButtonLabel="+ Add Column"
          maxItems={8}
        />
      </AccordionSection>

      <AccordionSection title="Bottom Text">
        <TextArea
          label="Copyright"
          value={footerSettings.copyright}
          onChange={(val) => updateNestedSetting('footer', 'copyright', val)}
          rows={2}
          maxLength={240}
        />
        <TextArea
          label="Note"
          value={footerSettings.note}
          onChange={(val) => updateNestedSetting('footer', 'note', val)}
          rows={2}
          maxLength={240}
        />
      </AccordionSection>
    </div>
  );
}
