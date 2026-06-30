import { SiteSection } from '@/components/SiteSections';
import { getActiveProducts } from '@/lib/products';
import { getSiteConfig } from '@/lib/site';

export default async function Home() {
  const [products, site] = await Promise.all([getActiveProducts(), getSiteConfig()]);
  const page = site.pages.find((item) => item.slug === 'home' && item.active);
  if (!page) {
    return <main className="mx-auto max-w-7xl px-6 py-20"><h1 className="text-4xl font-black">Homepage not configured</h1></main>;
  }
  return (
    <main>
      {page.sections
        .filter((section) => section.active)
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((section) => <SiteSection key={section.id} section={section} products={products} />)}
    </main>
  );
}
