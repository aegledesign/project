import Image from 'next/image';
import Link from 'next/link';
import { Settings, ShoppingBag } from 'lucide-react';
import { getSiteConfig } from '@/lib/site';

export async function Header() {
  const site = await getSiteConfig();
  const navigation = site.navigation
    .filter((item) => item.active && item.location === 'HEADER')
    .sort((left, right) => left.displayOrder - right.displayOrder);
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-xl font-black">
          {site.theme.logoUrl && <Image src={site.theme.logoUrl} alt="" width={36} height={36} className="h-9 w-9 object-contain" />}
          {site.theme.brandName}
        </Link>
        <nav className="hidden gap-6 text-sm font-semibold md:flex">
          {navigation.map((item) => <Link key={item.id} href={item.href} className="hover:text-[var(--accent)]">{item.label}</Link>)}
        </nav>
        <div className="flex gap-2">
          <Link href="/cart" className="btn-secondary !px-4" aria-label="Cart"><ShoppingBag size={18} /></Link>
          <Link href="/admin" className="btn-primary !px-4" aria-label="Admin"><Settings size={18} /></Link>
        </div>
      </div>
    </header>
  );
}
