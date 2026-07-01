'use client';

import { useEffect, useState } from 'react';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Product, ProductCollection } from '@/lib/types';

function newCollection(order: number): ProductCollection {
  const now = new Date().toISOString();
  return {
    id: '',
    name: '',
    slug: '',
    description: '',
    productIds: [],
    displayOrder: order,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

export default function AdminCollections() {
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<ProductCollection>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [collectionsResponse, productsResponse] = await Promise.all([
        fetch('/api/admin/collections'),
        fetch('/api/products'),
      ]);
      if (!collectionsResponse.ok || !productsResponse.ok) throw new Error('Unable to load collections');
      setCollections(await collectionsResponse.json());
      setProducts(await productsResponse.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load collections');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    if (!draft) return;
    setError('');
    setMessage('');
    const collection = {
      ...draft,
      slug: draft.slug || draft.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    const response = await fetch(
      collection.id ? `/api/admin/collections/${collection.id}` : '/api/admin/collections',
      {
        method: collection.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collection),
      },
    );
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? 'Unable to save collection');
      return;
    }
    setDraft(undefined);
    setMessage('Collection saved');
    await load();
  }

  async function remove(collection: ProductCollection) {
    if (!window.confirm(`Delete ${collection.name}? Products will not be deleted.`)) return;
    const response = await fetch(`/api/admin/collections/${collection.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Unable to delete collection');
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">Product collections</h1>
          <p className="mt-2 text-slate-600">Internal product grouping. Collections are not published to the storefront.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setDraft(newCollection(collections.length))}>
          <Plus size={17} /> Add collection
        </button>
      </div>
      {error && <div className="mt-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>}
      {message && <div className="mt-5 border border-teal-300 bg-teal-50 p-4 text-teal-800">{message}</div>}
      {loading ? (
        <p className="mt-8 text-slate-500">Loading collections...</p>
      ) : collections.length === 0 ? (
        <div className="mt-8 border border-dashed border-slate-300 bg-white p-10 text-center">
          <Boxes className="mx-auto text-slate-400" />
          <p className="mt-3 font-bold">No collections yet</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {collections.map((collection) => (
            <article key={collection.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">{collection.name}</h2>
                  <p className="text-xs font-semibold text-slate-500">/{collection.slug} · Order {collection.displayOrder}</p>
                </div>
                <span className={`text-xs font-bold ${collection.active ? 'text-teal-700' : 'text-slate-400'}`}>
                  {collection.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{collection.description || 'No internal description'}</p>
              <p className="mt-4 text-sm font-bold">{collection.productIds.length} assigned product{collection.productIds.length === 1 ? '' : 's'}</p>
              <div className="mt-4 flex gap-2">
                <button className="btn-secondary flex items-center gap-2 !px-3 !py-2" onClick={() => setDraft(collection)}>
                  <Pencil size={15} /> Edit
                </button>
                <button className="btn-secondary flex items-center gap-2 !px-3 !py-2 !text-red-700" onClick={() => void remove(collection)}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-5">
          <div className="mx-auto max-w-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">{draft.id ? 'Edit collection' : 'New collection'}</h2>
              <button className="text-sm font-bold" onClick={() => setDraft(undefined)}>Close</button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="label">Name
                <input className="input mt-1" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </label>
              <label className="label">Slug
                <input className="input mt-1" placeholder="generated from name" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
              </label>
              <label className="label sm:col-span-2">Internal description
                <textarea className="input mt-1 min-h-24" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </label>
              <label className="label">Display order
                <input className="input mt-1" type="number" min="0" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} />
              </label>
              <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
                <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
                Active internally
              </label>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="font-black">Assign products</h3>
              <div className="mt-3 max-h-72 divide-y overflow-y-auto border border-slate-200">
                {products.map((product) => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={draft.productIds.includes(product.id)}
                      onChange={(event) => setDraft({
                        ...draft,
                        productIds: event.target.checked
                          ? [...draft.productIds, product.id]
                          : draft.productIds.filter((id) => id !== product.id),
                      })}
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">{product.name}</strong>
                      <span className="text-xs text-slate-500">{product.sku} · {product.category}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn-primary mt-6 w-full" onClick={() => void save()}>Save collection</button>
          </div>
        </div>
      )}
    </main>
  );
}
