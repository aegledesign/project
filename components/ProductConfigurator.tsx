'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { getPrintLocations } from '@/lib/productMedia';
import { getUnitPrice, totalQty } from '@/lib/pricing';
import { useCart } from '@/lib/cartClient';

export function ProductConfigurator({ product }: { product: Product }) {
  const variants = product.variants.filter((variant) => variant.active);
  const locations = getPrintLocations(product);
  const [color, setColor] = useState(variants[0]?.colorName ?? '');
  const [location, setLocation] = useState(locations[0] ?? '');
  const [sizes, setSizes] = useState<Record<string, number>>({ [product.sizes[0]]: 12 });
  const qty = totalQty(sizes);
  const unit = useMemo(() => getUnitPrice(product, qty), [product, qty]);
  const add = useCart((state) => state.add);

  return (
    <div className="mt-8 space-y-6">
      <div>
        <label className="label">Color</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setColor(variant.colorName)}
              className={`border px-4 py-2 text-sm font-bold ${variant.colorName === color ? 'bg-ink text-white' : 'bg-white'}`}
            >
              {variant.colorName}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Print location</label>
        <select className="input mt-2" value={location} onChange={(event) => setLocation(event.target.value)}>
          {locations.map((label) => <option key={label}>{label}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Sizes / quantities</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {product.sizes.map((size) => (
            <div key={size}>
              <div className="mb-1 text-xs font-bold">{size}</div>
              <input className="input" type="number" min="0" value={sizes[size] ?? 0} onChange={(event) => setSizes({ ...sizes, [size]: Number(event.target.value) })} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-5 shadow">
        <div className="flex justify-between"><span>Total qty</span><b>{qty}</b></div>
        <div className="flex justify-between"><span>Unit price</span><b>${unit.toFixed(2)}</b></div>
        <div className="mt-2 flex justify-between border-t pt-2 text-xl"><span>Total</span><b>${(qty * unit).toFixed(2)}</b></div>
        <button className="btn-primary mt-4 w-full" onClick={() => add({ id: crypto.randomUUID(), productSlug: product.slug, productName: product.name, color, printLocation: location, sizes, unitPrice: unit })}>
          Add configured item to cart
        </button>
      </div>
    </div>
  );
}
