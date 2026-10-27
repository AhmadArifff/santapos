'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import TextArea from '../form/TextArea';
import ImageUpload from '../form/ImageUpload';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

function linesToString(lines) {
  if (!Array.isArray(lines)) return '';
  return lines.join('\n');
}

export default function LocationsSettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const locationsSettings = settings.locations || {};
  const branches = locationsSettings.branches || [];

  return (
    <div className="space-y-6">
      <AccordionSection title="Section Content" defaultOpen={true}>
        <TextInput
          label="Section Label"
          value={locationsSettings.sectionLabel}
          onChange={(val) => updateNestedSetting('locations', 'sectionLabel', val)}
          maxLength={60}
        />
        <TextInput
          label="Title"
          value={locationsSettings.title}
          onChange={(val) => updateNestedSetting('locations', 'title', val)}
          maxLength={100}
        />
        <TextInput
          label="Highlight Text"
          value={locationsSettings.highlight}
          onChange={(val) => updateNestedSetting('locations', 'highlight', val)}
          maxLength={50}
        />
        <TextInput
          label="Subtitle"
          value={locationsSettings.subtitle}
          onChange={(val) => updateNestedSetting('locations', 'subtitle', val)}
          maxLength={100}
        />
        <TextArea
          label="Description"
          value={locationsSettings.description}
          onChange={(val) => updateNestedSetting('locations', 'description', val)}
          rows={3}
          maxLength={280}
        />
      </AccordionSection>

      <AccordionSection title="Branches">
        <DynamicArray
          items={branches}
          label="Branch List"
          onAdd={() =>
            addArrayItem('locations', 'branches', {
              id: `branch-${Date.now()}`,
              tabLabel: 'Cabang Baru',
              sectionTag: 'Cabang',
              name: 'Nama Cabang',
              area: 'Kota',
              gallery: [''],
              details: [{ icon: '*', text: 'Detail cabang' }],
              mapEmbed: '',
              mapUrl: '',
            })
          }
          onRemove={(idx) => removeArrayItem('locations', 'branches', idx)}
          renderItem={(branch, bIdx) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Branch ID"
                  value={branch.id}
                  onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.id`, val)}
                />
                <TextInput
                  label="Tab Label"
                  value={branch.tabLabel}
                  onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.tabLabel`, val)}
                />
              </div>
              <TextInput
                label="Section Tag"
                value={branch.sectionTag}
                onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.sectionTag`, val)}
              />
              <TextInput
                label="Branch Name"
                value={branch.name}
                onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.name`, val)}
                maxLength={100}
              />
              <TextInput
                label="Area"
                value={branch.area}
                onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.area`, val)}
                maxLength={120}
              />

              <DynamicArray
                items={branch.gallery || []}
                label="Gallery Images"
                onAdd={() => addArrayItem('locations', `branches.${bIdx}.gallery`, '')}
                onRemove={(gIdx) => removeArrayItem('locations', `branches.${bIdx}.gallery`, gIdx)}
                renderItem={(img, gIdx) => (
                  <ImageUpload
                    label={`Gallery Image ${gIdx + 1}`}
                    value={img}
                    onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.gallery.${gIdx}`, val)}
                    uploadKey={`location-${bIdx + 1}-gallery-${gIdx + 1}`}
                    hint="Upload gambar cabang atau tempel URL gambar."
                  />
                )}
                addButtonLabel="+ Add Gallery Image"
                maxItems={10}
              />

              <DynamicArray
                items={branch.details || []}
                label="Branch Details"
                onAdd={() =>
                  addArrayItem('locations', `branches.${bIdx}.details`, {
                    icon: '*',
                    text: '',
                    lines: '',
                  })
                }
                onRemove={(dIdx) => removeArrayItem('locations', `branches.${bIdx}.details`, dIdx)}
                renderItem={(detail, dIdx) => (
                  <div className="space-y-2">
                    <TextInput
                      label="Icon"
                      value={detail.icon}
                      onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.details.${dIdx}.icon`, val)}
                      maxLength={6}
                    />
                    <TextInput
                      label="Single Text"
                      value={detail.text}
                      onChange={(val) => {
                        updateNestedSetting('locations', `branches.${bIdx}.details.${dIdx}.text`, val);
                        if (val) {
                          updateNestedSetting('locations', `branches.${bIdx}.details.${dIdx}.lines`, '');
                        }
                      }}
                    />
                    <TextArea
                      label="Multi-line Text (1 line per row)"
                      value={linesToString(detail.lines)}
                      onChange={(val) => {
                        const parsed = val
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean);
                        updateNestedSetting(
                          'locations',
                          `branches.${bIdx}.details.${dIdx}.lines`,
                          parsed.length ? parsed : '',
                        );
                        if (parsed.length) {
                          updateNestedSetting('locations', `branches.${bIdx}.details.${dIdx}.text`, '');
                        }
                      }}
                      rows={3}
                    />
                  </div>
                )}
                addButtonLabel="+ Add Detail"
                maxItems={8}
              />

              <TextArea
                label="Map Embed URL"
                value={branch.mapEmbed}
                onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.mapEmbed`, val)}
                rows={2}
              />
              <TextInput
                label="Google Maps URL"
                value={branch.mapUrl}
                onChange={(val) => updateNestedSetting('locations', `branches.${bIdx}.mapUrl`, val)}
              />
            </div>
          )}
          addButtonLabel="+ Add Branch"
          maxItems={20}
        />
      </AccordionSection>
    </div>
  );
}
