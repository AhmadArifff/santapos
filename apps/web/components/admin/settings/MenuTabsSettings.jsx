'use client';

import { useEffect, useMemo, useState } from 'react';
import AccordionSection from '../form/AccordionSection';
import TextInput from '../form/TextInput';
import TextArea from '../form/TextArea';
import ImageUpload from '../form/ImageUpload';
import DynamicArray from '../form/DynamicArray';
import { getCategories, getProducts } from '@/lib/api';
import { useLandingSettingsStore } from '@/store/landingSettingsStore';

const formatRupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const formatIngredientQty = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(number);
};

const normalizeColorInputValue = (value) =>
  /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#C9A84C';

const buildRecipeDescription = (product) => {
  const ingredients = Array.isArray(product?.ingredients) ? product.ingredients : [];
  if (!ingredients.length) return product?.description || product?.name || '';

  return ingredients
    .map((ingredient) => {
      const name = ingredient.ingredient_name || ingredient.name || ingredient.stock_item_name || 'Bahan';
      const qty = ingredient.qty ? ` ${formatIngredientQty(ingredient.qty)}` : '';
      const unit = ingredient.unit ? ` ${ingredient.unit}` : '';
      return `${name}${qty}${unit}`.trim();
    })
    .join(', ');
};

const buildMenuItemsFromProducts = (products, existingItems = []) => {
  const existingByProduct = new Map();
  const existingByName = new Map();

  existingItems.forEach((item) => {
    if (item.productId) existingByProduct.set(String(item.productId), item);
    if (item.name) existingByName.set(String(item.name).toLowerCase(), item);
  });

  return products.map((product, index) => {
    const previous =
      existingByProduct.get(String(product.id)) ||
      existingByName.get(String(product.name || '').toLowerCase()) ||
      {};

    return {
      id: index + 1,
      productId: product.id,
      name: product.name || '',
      orderName: product.name || '',
      image: product.image_url || '',
      tag: previous.tag || '',
      tagClass: previous.tagClass || 'tag-new',
      tagColor: previous.tagColor || '',
      description: buildRecipeDescription(product),
      price: formatRupiah(product.price),
    };
  });
};

export default function MenuTabsSettings() {
  const { settings, updateNestedSetting, updateArrayItem, addArrayItem, removeArrayItem } = useLandingSettingsStore();
  const menuTabsSettings = settings.menuTabs || {};
  const categories = menuTabsSettings.categories || [];
  const [productCategories, setProductCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const [categoryRes, productRes] = await Promise.all([getCategories(), getProducts()]);
        if (!active) return;
        setProductCategories(Array.isArray(categoryRes.data) ? categoryRes.data : []);
        setProducts(Array.isArray(productRes.data) ? productRes.data : []);
      } catch (_) {
        if (!active) return;
        setProductCategories([]);
        setProducts([]);
      } finally {
        if (active) setCatalogLoading(false);
      }
    };

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const productsByCategoryId = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      const key = String(product.category_id || '');
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(product);
    });
    return map;
  }, [products]);

  const syncCategoryFromProductCategory = (categoryIndex, selectedProductCategoryId) => {
    const selectedCategory = productCategories.find((item) => String(item.id) === String(selectedProductCategoryId));
    const categoryProducts = productsByCategoryId.get(String(selectedProductCategoryId)) || [];
    const currentCategory = categories[categoryIndex] || {};
    const nextItems = buildMenuItemsFromProducts(categoryProducts, currentCategory.items || []);

    updateArrayItem('menuTabs', 'categories', categoryIndex, {
      ...currentCategory,
      label: selectedCategory?.name || currentCategory.label || '',
      items: nextItems,
    });
  };

  return (
    <div className="space-y-6">
      <div data-tour="landing-menu-tabs-content">
      <AccordionSection title="Section Content" defaultOpen={true}>
        <TextInput
          label="Section Label"
          value={menuTabsSettings.sectionLabel}
          onChange={(val) => updateNestedSetting('menuTabs', 'sectionLabel', val)}
          maxLength={60}
        />
        <TextInput
          label="Title"
          value={menuTabsSettings.title}
          onChange={(val) => updateNestedSetting('menuTabs', 'title', val)}
          maxLength={100}
        />
        <TextInput
          label="Highlight Text"
          value={menuTabsSettings.highlight}
          onChange={(val) => updateNestedSetting('menuTabs', 'highlight', val)}
          maxLength={40}
        />
        <TextArea
          label="Description"
          value={menuTabsSettings.description}
          onChange={(val) => updateNestedSetting('menuTabs', 'description', val)}
          rows={4}
          maxLength={320}
        />
      </AccordionSection>
      </div>

      <div data-tour="landing-menu-tabs-categories">
      <AccordionSection title="Categories & Items">
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs leading-6 text-yellow-100">
          Isi <b>Category ID</b> untuk ID landing page, lalu pilih <b>Category Label</b> dari kategori produk.
          Items akan otomatis terisi dari data menu produk pada kategori tersebut. Item ID dibuat berurutan dan tidak
          perlu diedit.
        </div>
        {catalogLoading && (
          <p className="text-xs text-slate-400">Memuat kategori dan produk...</p>
        )}
        <DynamicArray
          items={categories}
          label="Menu Categories"
          onAdd={() =>
            addArrayItem('menuTabs', 'categories', {
              id: `cat-${Date.now()}`,
              label: 'Kategori Baru',
              items: [],
            })
          }
          onRemove={(idx) => removeArrayItem('menuTabs', 'categories', idx)}
          renderItem={(category, cIdx) => (
            <div className="space-y-3">
              <div data-tour="landing-menu-tabs-category-id">
              <TextInput
                label="Category ID"
                value={category.id}
                onChange={(val) => updateNestedSetting('menuTabs', `categories.${cIdx}.id`, val)}
                maxLength={40}
              />
              </div>
              <div data-tour="landing-menu-tabs-category-label">
              <TextInput
                label="Category Label"
                value={category.label}
                onChange={(val) => updateNestedSetting('menuTabs', `categories.${cIdx}.label`, val)}
                maxLength={80}
              />
              </div>
              <div data-tour="landing-menu-tabs-load-products" className="form-group">
                <label className="form-label">Load Category Label dari Produk</label>
                <select
                  value={productCategories.find((item) => item.name === category.label)?.id || ''}
                  onChange={(e) => syncCategoryFromProductCategory(cIdx, e.target.value)}
                  className="form-input"
                  disabled={catalogLoading}
                >
                  <option value="">-- Pilih kategori produk untuk auto-load items --</option>
                  {productCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({productsByCategoryId.get(String(item.id))?.length || 0} produk)
                    </option>
                  ))}
                </select>
                <p className="form-hint">
                  Pilihan ini mengisi Name, Order Name, Image, Description bahan, dan Price dari data produk.
                </p>
              </div>

              <DynamicArray
                items={category.items || []}
                label="Items"
                onAdd={() =>
                  addArrayItem('menuTabs', `categories.${cIdx}.items`, {
                    id: (category.items || []).length + 1,
                    name: 'Menu Baru',
                    orderName: 'Menu Baru',
                    image: '',
                    tag: '',
                    tagClass: 'tag-new',
                    tagColor: '',
                    description: 'Deskripsi menu',
                    price: 'Rp 0',
                  })
                }
                onRemove={(iIdx) => removeArrayItem('menuTabs', `categories.${cIdx}.items`, iIdx)}
                renderItem={(item, iIdx) => (
                  <div data-tour="landing-menu-tabs-item-row" className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput
                        label="Item ID"
                        value={iIdx + 1}
                        onChange={() => {}}
                        disabled
                        hint="Otomatis berurutan dari daftar item."
                      />
                      <TextInput
                        label="Tag Class"
                        value={item.tagClass}
                        onChange={(val) =>
                          updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.tagClass`, val)
                        }
                        placeholder="tag-popular"
                      />
                    </div>
                    <TextInput
                      label="Name"
                      value={item.name}
                      onChange={(val) =>
                        updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.name`, val)
                      }
                      maxLength={80}
                    />
                    <TextInput
                      label="Order Name"
                      value={item.orderName}
                      onChange={(val) =>
                        updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.orderName`, val)
                      }
                      maxLength={80}
                    />
                    <div data-tour="landing-menu-tabs-item-image">
                    <ImageUpload
                      label="Image"
                      value={item.image}
                      onChange={(val) =>
                        updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.image`, val)
                      }
                    />
                    </div>
                    <div data-tour="landing-menu-tabs-item-tag">
                    <TextInput
                      label="Tag"
                      value={item.tag}
                      onChange={(val) =>
                        updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.tag`, val)
                      }
                      maxLength={30}
                    />
                    </div>
                    <div data-tour="landing-menu-tabs-item-tag-color" className="grid grid-cols-[56px_1fr] gap-3">
                      <div className="form-group">
                        <label className="form-label">Warna</label>
                        <input
                          type="color"
                          value={normalizeColorInputValue(item.tagColor)}
                          onChange={(e) =>
                            updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.tagColor`, e.target.value)
                          }
                          className="h-10 w-full cursor-pointer rounded-lg border border-slate-600 bg-slate-800 p-1"
                        />
                      </div>
                      <TextInput
                        label="Tag Color"
                        value={item.tagColor}
                        onChange={(val) =>
                          updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.tagColor`, val)
                        }
                        placeholder="#C9A84C"
                        maxLength={20}
                        hint="Kosongkan untuk memakai warna dari Tag Class."
                      />
                    </div>
                    <div data-tour="landing-menu-tabs-item-description">
                    <TextArea
                      label="Description"
                      value={item.description}
                      onChange={(val) =>
                        updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.description`, val)
                      }
                      rows={3}
                      maxLength={220}
                    />
                    </div>
                    <div data-tour="landing-menu-tabs-item-price">
                    <TextInput
                      label="Price"
                      value={item.price}
                      onChange={(val) =>
                        updateNestedSetting('menuTabs', `categories.${cIdx}.items.${iIdx}.price`, val)
                      }
                      maxLength={40}
                    />
                    </div>
                  </div>
                )}
                addButtonLabel="+ Add Item"
                maxItems={24}
              />
            </div>
          )}
          addButtonLabel="+ Add Category"
          maxItems={12}
        />
      </AccordionSection>
      </div>
    </div>
  );
}
