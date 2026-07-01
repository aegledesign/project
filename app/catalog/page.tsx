import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';
import { getPublishedCollections } from '@/lib/collections';
import { getActiveProducts } from '@/lib/products';

export default async function Catalog() {
  const [products, collections] = await Promise.all([
    getActiveProducts(),
    getPublishedCollections(),
  ]);
  const published = collections
    .map((collection) => ({
      collection,
      products: collection.productIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is NonNullable<typeof product> => Boolean(product)),
    }))
    .filter((entry) => entry.products.length > 0);

  return (
    <main>
      <header className="mx-auto max-w-7xl px-6 pb-10 pt-12">
        <h1 className="text-5xl font-black">Product catalog</h1>
        <p className="mt-3 text-lg text-slate-600">Browse customizable apparel and promotional products.</p>
      </header>

      {published.map(({ collection, products: collectionProducts }) => (
        <section key={collection.id} className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase text-teal-700">Collection</p>
                <h2 className="mt-1 text-3xl font-black">{collection.name}</h2>
                {collection.description && <p className="mt-2 max-w-2xl text-slate-600">{collection.description}</p>}
              </div>
              {collection.imageUrl && (
                <Image src={collection.imageUrl} alt="" width={140} height={90} className="hidden h-20 w-32 object-cover sm:block" />
              )}
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
              {collectionProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl font-black">{published.length ? 'All products' : 'Products'}</h2>
        {products.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="mt-8 border border-slate-300 bg-white p-8 text-center text-slate-500">No active products are available.</div>
        )}
      </section>
    </main>
  );
}
