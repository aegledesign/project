import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';
import { getActiveCategories } from '@/lib/categories';
import { getActiveProducts } from '@/lib/products';

export default async function Catalog() {
  const [products, categories] = await Promise.all([getActiveProducts(), getActiveCategories()]);
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-5xl font-black">Product catalog</h1>
      <p className="mt-3 text-lg text-slate-600">Browse backend-managed product categories, colors, mockups, and print locations.</p>
      {categories.length > 0 && (
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Product categories">
          {categories.map((category) => {
            const count = products.filter((product) => product.categoryId === category.id).length;
            return (
              <div key={category.id} className="relative min-h-44 overflow-hidden bg-slate-900 text-white">
                {category.imageUrl && <Image src={category.imageUrl} alt="" fill className="object-cover opacity-55" />}
                <div className="relative flex min-h-44 flex-col justify-end p-5">
                  <h2 className="text-xl font-black">{category.name}</h2>
                  <p className="mt-1 text-sm text-white/80">{category.description}</p>
                  <span className="mt-3 text-xs font-bold">{count} product{count === 1 ? '' : 's'}</span>
                </div>
              </div>
            );
          })}
        </section>
      )}
      {products.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      ) : (
        <div className="mt-10 border border-slate-300 bg-white p-8 text-center text-slate-500">No active products are available.</div>
      )}
    </main>
  );
}
