'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cartClient';

export default function Cart() {
  const { items, remove, total } = useCart();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-5xl font-black">Cart</h1>
      {items.length === 0 ? (
        <div className="card mt-8 p-8">
          <p>Your cart is empty.</p>
          <Link href="/catalog" className="btn-primary mt-4 inline-block">Browse products</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          <div className="space-y-4">
            {items.map((item) => {
              const qty = Object.values(item.sizes).reduce((sum, value) => sum + value, 0);
              return (
                <div key={item.id} className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                  {item.preview && (
                    <img
                      src={item.preview}
                      alt={`${item.productName} design preview`}
                      className="h-28 w-28 border border-slate-200 bg-white object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-black">{item.productName}</h2>
                    <p className="text-sm text-slate-600">{item.color} · {item.printLocation} · Qty {qty}</p>
                    <p className="text-sm text-slate-600">${item.unitPrice.toFixed(2)} each</p>
                    {item.designJson && <p className="mt-1 text-xs font-semibold text-teal-700">Saved design attached</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black">${(qty * item.unitPrice).toFixed(2)}</div>
                    <button onClick={() => remove(item.id)} className="text-sm font-bold text-red-600">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card p-6">
            <div className="flex justify-between text-2xl font-black">
              <span>Estimated total</span>
              <span>${total().toFixed(2)}</span>
            </div>
            <Link href="/checkout" className="btn-primary mt-5 inline-block w-full text-center">
              Checkout / request quote
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
