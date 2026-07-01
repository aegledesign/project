import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getDefaultMockup } from '@/lib/productMedia';
import type { Product, ProductCollection } from '@/lib/types';

export function CollectionNavigation({
  collections,
  products,
}: {
  collections: ProductCollection[];
  products: Product[];
}) {
  const entries = collections.map((collection) => {
    const assigned = collection.productIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));
    const fallback = assigned[0] ? getDefaultMockup(assigned[0])?.imageUrl : undefined;
    return {
      collection,
      imageUrl: collection.imageUrl ?? fallback,
      productCount: assigned.length,
    };
  }).filter((entry) => entry.productCount > 0);

  if (entries.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-white" aria-labelledby="collection-navigation-heading">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase text-teal-700">Shop collections</p>
            <h2 id="collection-navigation-heading" className="mt-1 text-3xl font-black">Curated product lines</h2>
          </div>
          <Link href="/catalog" className="hidden items-center gap-2 text-sm font-bold text-teal-700 sm:flex">
            View catalog <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map(({ collection, imageUrl, productCount }) => (
            <Link
              key={collection.id}
              href={`/catalog#collection-${collection.slug}`}
              className="group relative aspect-[4/3] overflow-hidden bg-slate-900 text-white"
            >
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover opacity-65 transition duration-300 group-hover:scale-105 group-hover:opacity-75"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/75 p-4">
                <h3 className="text-xl font-black">{collection.name}</h3>
                <p className="mt-1 text-xs font-semibold text-white/75">
                  {productCount} product{productCount === 1 ? '' : 's'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
