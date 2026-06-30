'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import type { MediaAsset, MockupView, PrintArea, Product, ProductMockup } from '@/lib/types';

type PointerAction = { type: 'move' | 'resize'; startX: number; startY: number; initial: PrintArea };

const views: MockupView[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'DETAIL'];
const locationLabels = ['Front Chest', 'Full Front', 'Back', 'Left Sleeve', 'Right Sleeve', 'Pocket'];

function newArea(mockupId: string): PrintArea {
  return {
    id: crypto.randomUUID(),
    mockupId,
    label: 'Full Front',
    x: 0.3,
    y: 0.25,
    width: 0.4,
    height: 0.45,
    rotation: 0,
    bleed: 0.02,
    active: true,
  };
}

export function MockupEditor({ productId }: { productId: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<PointerAction | null>(null);
  const [product, setProduct] = useState<Product>();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<ProductMockup>();
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [productResponse, mediaResponse] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch('/api/admin/media'),
      ]);
      if (!productResponse.ok || !mediaResponse.ok) throw new Error('Unable to load mockup editor');
      const nextProduct: Product = await productResponse.json();
      setProduct(nextProduct);
      setAssets(await mediaResponse.json());
      if (!selectedId && nextProduct.mockups[0]) selectMockup(nextProduct.mockups[0]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load mockup editor');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [productId]);

  function selectMockup(mockup: ProductMockup) {
    setSelectedId(mockup.id);
    setDraft(structuredClone(mockup));
    setSelectedAreaId(mockup.printAreas[0]?.id ?? '');
    setMessage('');
  }

  async function upload(file: File) {
    setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('altText', `${product?.name ?? 'Product'} mockup`);
    const response = await fetch('/api/admin/media', { method: 'POST', body: form });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? 'Upload failed');
      return;
    }
    setAssets((current) => [...current, body]);
    createMockup(body);
  }

  function createMockup(asset?: MediaAsset) {
    if (!product) return;
    const selectedAsset = asset ?? assets[0];
    if (!selectedAsset) {
      setError('Upload a mockup image first');
      return;
    }
    const id = crypto.randomUUID();
    const variant = product.variants.find((item) => item.active);
    const mockup: ProductMockup = {
      id,
      productId,
      mediaAssetId: selectedAsset.id,
      imageUrl: selectedAsset.url,
      altText: selectedAsset.altText || `${product.name} mockup`,
      view: 'FRONT',
      colorKey: variant?.colorKey ?? '',
      displayOrder: product.mockups.length,
      active: true,
      isDefault: product.mockups.length === 0,
      printAreas: [newArea(id)],
    };
    setSelectedId('');
    setDraft(mockup);
    setSelectedAreaId(mockup.printAreas[0].id);
  }

  function updateArea(next: PrintArea) {
    if (!draft) return;
    setDraft({
      ...draft,
      printAreas: draft.printAreas.map((area) => area.id === next.id ? next : area),
    });
  }

  function pointerMove(event: React.PointerEvent) {
    const action = actionRef.current;
    const stage = stageRef.current;
    if (!action || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = (event.clientX - action.startX) / rect.width;
    const dy = (event.clientY - action.startY) / rect.height;
    const initial = action.initial;
    if (action.type === 'move') {
      updateArea({
        ...initial,
        x: Math.max(0, Math.min(1 - initial.width, initial.x + dx)),
        y: Math.max(0, Math.min(1 - initial.height, initial.y + dy)),
      });
    } else {
      updateArea({
        ...initial,
        width: Math.max(0.03, Math.min(1 - initial.x, initial.width + dx)),
        height: Math.max(0.03, Math.min(1 - initial.y, initial.height + dy)),
      });
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError('');
    const method = selectedId ? 'PUT' : 'POST';
    const url = selectedId
      ? `/api/admin/products/${productId}/mockups/${selectedId}`
      : `/api/admin/products/${productId}/mockups`;
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? 'Unable to save mockup');
      return;
    }
    setSelectedId(body.id);
    setDraft(body);
    setMessage('Mockup and printable areas saved');
    await load();
  }

  async function remove() {
    if (!selectedId || !window.confirm('Delete this mockup and its printable areas?')) return;
    const response = await fetch(`/api/admin/products/${productId}/mockups/${selectedId}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Unable to delete mockup');
      return;
    }
    setDraft(undefined);
    setSelectedId('');
    await load();
  }

  async function reorder(index: number, direction: -1 | 1) {
    if (!product) return;
    const ordered = [...product.mockups].sort((a, b) => a.displayOrder - b.displayOrder);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await fetch(`/api/admin/products/${productId}/mockups`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: ordered.map((item) => item.id) }),
    });
    await load();
  }

  if (loading) return <p className="py-16 text-center text-slate-500">Loading mockups...</p>;
  if (!product) return <div className="border border-red-300 bg-red-50 p-6">{error || 'Product not found'}</div>;
  const selectedArea = draft?.printAreas.find((area) => area.id === selectedAreaId);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/products" className="text-sm font-bold text-teal-700">Products</Link>
          <h1 className="mt-2 text-4xl font-black">{product.name} mockups</h1>
          <p className="mt-2 text-slate-600">Manage product views and normalized printable areas.</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn-secondary" href={`/products/${product.slug}`} target="_blank">Storefront preview</Link>
          <label className="btn-primary flex cursor-pointer items-center gap-2">
            <ImagePlus size={17} /> Upload mockup
            <input
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
      {error && <div className="mt-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>}
      {message && <div className="mt-5 border border-teal-300 bg-teal-50 p-4 text-teal-800">{message}</div>}

      <div className="mt-8 grid gap-6 xl:grid-cols-[240px_minmax(500px,1fr)_320px]">
        <aside className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black">Mockups</h2>
            <button title="Create from media" className="border border-slate-300 p-2" onClick={() => createMockup()}><Plus size={16} /></button>
          </div>
          {product.mockups.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Upload the first mockup.</p>
          ) : [...product.mockups].sort((a, b) => a.displayOrder - b.displayOrder).map((mockup, index) => (
            <div key={mockup.id} className={`mt-2 border p-2 ${selectedId === mockup.id ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}>
              <button className="w-full text-left" onClick={() => selectMockup(mockup)}>
                <img src={mockup.imageUrl} alt="" className="h-20 w-full bg-white object-contain" />
                <span className="mt-1 block text-sm font-bold">{mockup.view} · {mockup.colorKey}</span>
              </button>
              <div className="mt-2 flex gap-1">
                <button title="Move up" className="border bg-white p-1" onClick={() => void reorder(index, -1)}><ArrowUp size={14} /></button>
                <button title="Move down" className="border bg-white p-1" onClick={() => void reorder(index, 1)}><ArrowDown size={14} /></button>
              </div>
            </div>
          ))}
        </aside>

        <section className="min-w-0">
          {draft ? (
            <div
              ref={stageRef}
              className="relative mx-auto aspect-square w-full max-w-[700px] touch-none overflow-hidden border border-slate-300 bg-slate-100"
              onPointerMove={pointerMove}
              onPointerUp={() => { actionRef.current = null; }}
              onPointerLeave={() => { actionRef.current = null; }}
            >
              <img src={draft.imageUrl} alt={draft.altText} className="absolute inset-0 h-full w-full object-contain" />
              {draft.printAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setSelectedAreaId(area.id);
                    actionRef.current = { type: 'move', startX: event.clientX, startY: event.clientY, initial: area };
                  }}
                  className={`absolute border-2 border-dashed bg-teal-500/15 text-left ${selectedAreaId === area.id ? 'border-teal-700' : 'border-white'}`}
                  style={{
                    left: `${area.x * 100}%`,
                    top: `${area.y * 100}%`,
                    width: `${area.width * 100}%`,
                    height: `${area.height * 100}%`,
                    transform: `rotate(${area.rotation}deg)`,
                  }}
                >
                  <span className="absolute left-0 top-0 bg-white px-2 py-1 text-xs font-bold">{area.label}</span>
                  <span
                    className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize bg-teal-700"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setSelectedAreaId(area.id);
                      actionRef.current = { type: 'resize', startX: event.clientX, startY: event.clientY, initial: area };
                    }}
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center border border-dashed border-slate-300 text-slate-500">Select or upload a mockup</div>
          )}
        </section>

        <aside className="card space-y-4 p-5">
          {draft ? (
            <>
              <label className="label">Media asset
                <select
                  className="input mt-1"
                  value={draft.mediaAssetId}
                  onChange={(event) => {
                    const asset = assets.find((item) => item.id === event.target.value);
                    if (asset) setDraft({ ...draft, mediaAssetId: asset.id, imageUrl: asset.url });
                  }}
                >
                  {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.fileName}</option>)}
                </select>
              </label>
              <label className="label">Alt text
                <input className="input mt-1" value={draft.altText} onChange={(event) => setDraft({ ...draft, altText: event.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="label">View
                  <select className="input mt-1" value={draft.view} onChange={(event) => setDraft({ ...draft, view: event.target.value as MockupView })}>
                    {views.map((view) => <option key={view}>{view}</option>)}
                  </select>
                </label>
                <label className="label">Color
                  <select className="input mt-1" value={draft.colorKey} onChange={(event) => setDraft({ ...draft, colorKey: event.target.value })}>
                    {product.variants.map((variant) => <option key={variant.id} value={variant.colorKey}>{variant.colorName}</option>)}
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })} />
                Default product image
              </label>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black">Printable areas</h3>
                  <button
                    title="Add printable area"
                    className="border border-slate-300 p-2"
                    onClick={() => {
                      const area = newArea(draft.id);
                      setDraft({ ...draft, printAreas: [...draft.printAreas, area] });
                      setSelectedAreaId(area.id);
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {draft.printAreas.map((area) => (
                  <button key={area.id} className={`mt-2 w-full border px-3 py-2 text-left text-sm ${selectedAreaId === area.id ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`} onClick={() => setSelectedAreaId(area.id)}>
                    {area.label}
                  </button>
                ))}
              </div>
              {selectedArea && (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <label className="label">Location label
                    <input className="input mt-1" list="print-location-labels" value={selectedArea.label} onChange={(event) => updateArea({ ...selectedArea, label: event.target.value })} />
                    <datalist id="print-location-labels">{locationLabels.map((label) => <option key={label}>{label}</option>)}</datalist>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="label">Rotation
                      <input className="input mt-1" type="number" min="-360" max="360" value={selectedArea.rotation} onChange={(event) => updateArea({ ...selectedArea, rotation: Number(event.target.value) })} />
                    </label>
                    <label className="label">Bleed
                      <input className="input mt-1" type="number" min="0" max=".25" step=".01" value={selectedArea.bleed} onChange={(event) => updateArea({ ...selectedArea, bleed: Number(event.target.value) })} />
                    </label>
                  </div>
                  <button className="flex items-center gap-2 text-sm font-bold text-red-700" onClick={() => {
                    setDraft({ ...draft, printAreas: draft.printAreas.filter((area) => area.id !== selectedArea.id) });
                    setSelectedAreaId('');
                  }}>
                    <Trash2 size={15} /> Delete print area
                  </button>
                </div>
              )}
              <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={saving} onClick={() => void save()}>
                <Save size={17} /> {saving ? 'Saving...' : 'Save mockup'}
              </button>
              {selectedId && <button className="btn-secondary flex w-full items-center justify-center gap-2 !text-red-700" onClick={() => void remove()}><Trash2 size={17} /> Delete mockup</button>}
            </>
          ) : <p className="text-sm text-slate-500">Mockup settings appear here.</p>}
        </aside>
      </div>
    </div>
  );
}
