import Link from 'next/link';
import { getCategories } from '@/lib/categories';
import { getProducts } from '@/lib/products';
import { readJson } from '@/lib/dataStore';
import type { Order } from '@/lib/types';

export default async function Admin() {
  const [products, categories, orders] = await Promise.all([
    getProducts(),
    getCategories(),
    readJson<Order[]>('orders.json', []),
  ]);
  const cards = [
    ['Products', products.length, '/admin/products'],
    ['Categories', categories.length, '/admin/categories'],
    ['Orders', orders.length, '/admin/orders'],
    ['Content blocks', 6, '/admin/content'],
    ['Proof queue', orders.filter((order) => order.proofStatus === 'Pending').length, '/admin/orders'],
  ];
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-5xl font-black">Editable backend</h1>
      <p className="mt-3 text-slate-600">Manage product lines, categories, visual assets, content, orders, and production workflow.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3 lg:grid-cols-5">
        {cards.map(([title, count, href]) => (
          <Link key={String(title)} href={String(href)} className="card p-6">
            <div className="text-4xl font-black">{count}</div>
            <div className="mt-2 font-bold">{title}</div>
          </Link>
        ))}
      </div>
      <div className="mt-8 border-y border-slate-300 py-6">
        <h2 className="text-2xl font-black">Production workflow</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          {['Quote Requested', 'Artwork Review', 'Proof Sent', 'Approved', 'In Production', 'Shipped'].map((status) => (
            <div className="bg-slate-100 p-4 text-center text-sm font-bold" key={status}>{status}</div>
          ))}
        </div>
      </div>
    </main>
  );
}
