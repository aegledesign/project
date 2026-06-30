import Image from 'next/image';
import Link from 'next/link';
import type { PageSection, Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

export function SiteSection({ section, products }: { section: PageSection; products: Product[] }) {
  const content = section.content;

  if (content.type === 'HERO') {
    return (
      <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-slate-900 text-white">
        <Image src={content.imageUrl} alt={content.imageAlt} fill priority className="object-cover opacity-65" />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-40">
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">{content.headline}</h1>
          <p className="mt-5 max-w-2xl text-xl text-white/90">{content.subheading}</p>
          <Link href={content.primaryHref} className="mt-8 inline-block bg-white px-6 py-3 text-sm font-bold text-slate-950">{content.primaryLabel}</Link>
        </div>
      </section>
    );
  }

  if (content.type === 'CATEGORY_GRID') {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl font-black">{content.heading}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {content.categories.map((category) => (
            <Link key={category.name} href={category.href} className="group relative aspect-[4/3] overflow-hidden bg-slate-200">
              <Image src={category.imageUrl} alt="" fill className="object-cover transition group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-black/75 p-5 text-xl font-black text-white">{category.name}</div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  if (content.type === 'FEATURED_PRODUCTS') {
    const featured = content.productIds.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-black">{content.heading}</h2>
          <Link href="/catalog" className="font-bold text-[var(--accent)]">View all</Link>
        </div>
        {featured.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : <p className="mt-8 text-slate-500">No featured products are active.</p>}
      </section>
    );
  }

  if (content.type === 'PROMO_BANNER') {
    return (
      <section className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
          <div><h2 className="text-3xl font-black">{content.headline}</h2><p className="mt-2 text-slate-300">{content.body}</p></div>
          <Link href={content.href} className="bg-white px-5 py-3 text-sm font-bold text-slate-950">{content.linkLabel}</Link>
        </div>
      </section>
    );
  }

  if (content.type === 'TESTIMONIALS') {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl font-black">{content.heading}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {content.items.map((item) => (
            <blockquote key={`${item.name}-${item.organization}`} className="border-l-4 border-[var(--accent)] bg-white p-6">
              <p className="text-lg">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4 text-sm font-bold">{item.name} · {item.organization}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    );
  }

  if (content.type === 'FAQ') {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-3xl font-black">{content.heading}</h2>
        <div className="mt-8 divide-y border-y border-slate-300">
          {content.items.map((item) => (
            <details key={item.question} className="py-5">
              <summary className="cursor-pointer font-bold">{item.question}</summary>
              <p className="mt-3 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }

  return null;
}
