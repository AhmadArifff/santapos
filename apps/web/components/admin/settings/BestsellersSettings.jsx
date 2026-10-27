'use client';

import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import TextArea from '../form/TextArea';
import ImageUpload from '../form/ImageUpload';
import DynamicArray from '../form/DynamicArray';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

export default function BestsellersSettings() {
  const { settings, updateNestedSetting, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const bestsellersSettings = settings.bestsellers || {};
  const products = bestsellersSettings.products || [];

  return (
    <div className="space-y-6">
      <AccordionSection title="Section Content" defaultOpen={true}>
        <TextInput
          label="Section Label"
          value={bestsellersSettings.sectionLabel}
          onChange={(val) => updateNestedSetting('bestsellers', 'sectionLabel', val)}
          maxLength={60}
          placeholder="e.g., Favorit Pelanggan"
        />
        <TextInput
          label="Title"
          value={bestsellersSettings.title}
          onChange={(val) => updateNestedSetting('bestsellers', 'title', val)}
          maxLength={100}
          placeholder="e.g., Menu Best Seller"
        />
        <TextInput
          label="Highlight Text"
          value={bestsellersSettings.highlight}
          onChange={(val) => updateNestedSetting('bestsellers', 'highlight', val)}
          maxLength={40}
          placeholder="e.g., Best Seller"
        />
        <TextArea
          label="Description"
          value={bestsellersSettings.description}
          onChange={(val) => updateNestedSetting('bestsellers', 'description', val)}
          rows={4}
          maxLength={300}
        />
      </AccordionSection>

      <AccordionSection title="Products">
        <DynamicArray
          items={products}
          label="Best Seller Products"
          onAdd={() =>
            addArrayItem('bestsellers', 'products', {
              id: Date.now(),
              number: `0${products.length + 1}`,
              badge: 'New',
              name: 'Menu Baru',
              image: '',
              description: 'Deskripsi menu baru',
              price: 'Rp 0',
              ratingText: '5.0 (0)',
              orderName: 'Menu Baru',
            })
          }
          onRemove={(idx) => removeArrayItem('bestsellers', 'products', idx)}
          renderItem={(item, idx) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="ID"
                  value={item.id}
                  onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.id`, val)}
                />
                <TextInput
                  label="Number"
                  value={item.number}
                  onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.number`, val)}
                  maxLength={4}
                  placeholder="e.g., 01"
                />
              </div>
              <TextInput
                label="Badge"
                value={item.badge}
                onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.badge`, val)}
                maxLength={40}
              />
              <TextInput
                label="Product Name"
                value={item.name}
                onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.name`, val)}
                maxLength={80}
              />
              <ImageUpload
                label="Product Image"
                value={item.image}
                onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.image`, val)}
              />
              <TextArea
                label="Description"
                value={item.description}
                onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.description`, val)}
                rows={3}
                maxLength={240}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Price"
                  value={item.price}
                  onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.price`, val)}
                  maxLength={30}
                  placeholder="e.g., Rp 65.000"
                />
                <TextInput
                  label="Rating Text"
                  value={item.ratingText}
                  onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.ratingText`, val)}
                  maxLength={30}
                  placeholder="e.g., 4.9 (2.4k)"
                />
              </div>
              <TextInput
                label="Order Name (WhatsApp)"
                value={item.orderName}
                onChange={(val) => updateNestedSetting('bestsellers', `products.${idx}.orderName`, val)}
                maxLength={80}
              />
            </div>
          )}
          addButtonLabel="+ Add Product"
          maxItems={8}
        />
      </AccordionSection>
    </div>
  );
}
