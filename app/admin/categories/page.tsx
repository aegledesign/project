'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ProductCategory } from '@/lib/types';

function emptyCategory(order: number): ProductCategory {
  return {
    id: '',
    name: '',
    slug: '',
    description: '',
    displayOrder: order,
    active: true,
  };
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [draft, setDraft] = useState<ProductCategory>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    const response = await fetch('/api/admin/categories');
    setLoading(false);
    if (!response.ok) {
      setError('Unable to load product categories');
      return;
    }
    setCategories(await response.json());
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    if (!draft) return;
    setError('');
    setMessage('');
    const category = {
      ...draft,
      slug: draft.slug || draft.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    const response = await fetch(
      category.id ? `/api/admin/categories/${category.id}` : '/api/admin/categories',
      {
        method: category.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      },
    );
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? 'Unable to save category');
      return;
    }
    setDraft(undefined);
    setMessage('Category saved');
    await load();
  }

  async function remove(category: ProductCategory) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? 'Unable to delete category');
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black">Product categories</h1>
          <p className="mt-2 text-slate-600">Organize product lines and control their storefront order.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setDraft(emptyCategory(categories.length))}>
          <Plus size={17} /> Add category
        </button>
      </div>
      {error && <div className="mt-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>}
      {message && <div className="mt-5 border border-teal-300 bg-teal-50 p-4 text-teal-800">{message}</div>}
      {loading ? <p className="mt-8 text-slate-500">Loading categories...</p> : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <article key={category.id} className="card flex gap-4 p-5">
              {category.imageUrl ? (
                <img src={category.imageUrl} alt="" className="h-24 w-24 border border-slate-200 object-cover" />
              ) : (
                <div className="h-24 w-24 border border-dashed border-slate-300 bg-slate-50" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{category.name}</h2>
                    <p className="text-xs font-semibold text-slate-500">/{category.slug} · Order {category.displayOrder}</p>
                  </div>
                  <span className={`text-xs font-bold ${category.active ? 'text-teal-700' : 'text-slate-400'}`}>{category.active ? 'Active' : 'Hidden'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                <div className="mt-4 flex gap-2">
                  <Link
                    className="btn-primary flex items-center gap-2 !px-3 !py-2"
                    href={`/admin/products?new=1&categoryId=${encodeURIComponent(category.id)}`}
                  >
                    <PackagePlus size={15} /> Add product
                  </Link>
                  <button className="btn-secondary flex items-center gap-2 !px-3 !py-2" onClick={() => setDraft(category)}><Pencil size={15} /> Edit</button>
                  <button className="btn-secondary flex items-center gap-2 !px-3 !py-2 !text-red-700" onClick={() => void remove(category)}><Trash2 size={15} /> Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-5">
          <div className="mx-auto max-w-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">{draft.id ? 'Edit category' : 'New category'}</h2>
              <button className="text-sm font-bold" onClick={() => setDraft(undefined)}>Close</button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="label block">Name
                <input className="input mt-1" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </label>
              <label className="label block">Slug
                <input className="input mt-1" placeholder="generated from name" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
              </label>
              <label className="label block">Description
                <textarea className="input mt-1 min-h-24" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </label>
              <label className="label block">Image URL
                <input className="input mt-1" value={draft.imageUrl ?? ''} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value || undefined })} />
              </label>
              <label className="label block">Display order
                <input className="input mt-1" type="number" min="0" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
                Active on storefront
              </label>
            </div>
            <button className="btn-primary mt-6 w-full" onClick={() => void save()}>Save category</button>
          </div>
        </div>
      )}
    </main>
  );
}
