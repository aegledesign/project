'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ImageIcon, Pencil, Trash2, Upload } from 'lucide-react';
import { getDefaultMockup } from '@/lib/productMedia';
import type { Product } from '@/lib/types';

function blankProduct(): Product {
  const id = crypto.randomUUID();
  return {
    id,
    slug: '',
    name: '',
    category: 'T-Shirts',
    description: '',
    variants: [{
      id: crypto.randomUUID(),
      productId: id,
      colorKey: 'WHITE',
      colorName: 'White',
      hexColor: '#ffffff',
      active: true,
    }],
    mockups: [],
    sizes: ['S', 'M', 'L', 'XL'],
    basePrice: 20,
    priceBreaks: [{ min: 12, unitPrice: 20 }],
    sku: '',
    active: true,
    tags: ['New'],
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [edit, setEdit] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Unable to load products');
      setProducts(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    if (!edit) return;
    setError('');
    const product = {
      ...edit,
      slug: edit.slug || edit.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? 'Unable to save product');
      return;
    }
    setEdit(null);
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this product and all of its mockups?')) return;
    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Unable to delete product');
      return;
    }
    await load();
  }

  async function changeProductImage(product: Product, file: File) {
    setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('altText', `${product.name} product image`);
    const response = await fetch(`/api/admin/products/${product.id}/primary-image`, {
      method: 'POST',
      body: form,
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? 'Unable to replace product image');
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">Products</h1>
          <p className="mt-2 text-slate-600">Product details, variants, mockups, and printable areas.</p>
        </div>
        <button className="btn-primary" onClick={() => setEdit(blankProduct())}>Add product</button>
      </div>
      {error && <div className="mt-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>}
      {loading ? (
        <p className="mt-10 text-slate-500">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="mt-10 border border-slate-300 bg-white p-8 text-center">No products have been created.</div>
      ) : (
        <div className="mt-8 space-y-3">
          {products.map((product) => (
            <div key={product.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {getDefaultMockup(product) ? (
                <img
                  src={getDefaultMockup(product)?.imageUrl}
                  alt=""
                  className="h-24 w-24 border border-slate-200 bg-slate-100 object-contain"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center border border-dashed border-slate-300 text-slate-400">
                  <ImageIcon size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black">{product.name}</h2>
                <p className="text-sm text-slate-600">
                  {product.category} · {product.sku} · {product.variants.length} colors · {product.mockups.length} mockups
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="btn-secondary flex cursor-pointer items-center gap-2">
                  <Upload size={16} /> Change picture
                  <input
                    className="hidden"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void changeProductImage(product, file);
                      event.target.value = '';
                    }}
                  />
                </label>
                <Link className="btn-primary flex items-center gap-2" href={`/admin/products/${product.id}/mockups`}>
                  <ImageIcon size={16} /> Mockups
                </Link>
                <button className="btn-secondary flex items-center gap-2" onClick={() => setEdit(product)}>
                  <Pencil size={16} /> Edit
                </button>
                <button className="btn-secondary flex items-center gap-2 !text-red-700" onClick={() => void remove(product.id)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-5">
          <div className="mx-auto max-w-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">{products.some((item) => item.id === edit.id) ? 'Edit product' : 'New product'}</h2>
              <button className="text-sm font-bold" onClick={() => setEdit(null)}>Close</button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(['name', 'slug', 'category', 'sku'] as const).map((key) => (
                <label key={key} className="label capitalize">
                  {key}
                  <input className="input mt-1" value={edit[key]} onChange={(event) => setEdit({ ...edit, [key]: event.target.value })} />
                </label>
              ))}
            </div>
            <label className="label mt-4 block">
              Description
              <textarea className="input mt-1 min-h-24" value={edit.description} onChange={(event) => setEdit({ ...edit, description: event.target.value })} />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="label">
                Base price
                <input className="input mt-1" type="number" min="0" value={edit.basePrice} onChange={(event) => setEdit({ ...edit, basePrice: Number(event.target.value) })} />
              </label>
              <label className="label">
                Sizes
                <input className="input mt-1" value={edit.sizes.join(', ')} onChange={(event) => setEdit({ ...edit, sizes: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
              </label>
              <label className="label">
                Tags
                <input className="input mt-1" value={edit.tags.join(', ')} onChange={(event) => setEdit({ ...edit, tags: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
              </label>
              <label className="label">
                Colors (Name:HEX)
                <input
                  className="input mt-1"
                  value={edit.variants.map((variant) => `${variant.colorName}:${variant.hexColor ?? '#ffffff'}`).join(', ')}
                  onChange={(event) => {
                    const variants = event.target.value.split(',').map((value, index) => {
                      const [name, hexColor] = value.trim().split(':');
                      return {
                        id: edit.variants[index]?.id ?? crypto.randomUUID(),
                        productId: edit.id,
                        colorKey: (name || `COLOR_${index + 1}`).toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
                        colorName: name || `Color ${index + 1}`,
                        hexColor: hexColor || '#ffffff',
                        active: true,
                      };
                    });
                    setEdit({ ...edit, variants });
                  }}
                />
              </label>
            </div>
            <button className="btn-primary mt-6 w-full" onClick={() => void save()}>Save product</button>
          </div>
        </div>
      )}
    </main>
  );
}
