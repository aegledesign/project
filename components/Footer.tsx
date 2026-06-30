import Image from 'next/image';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/site';

export async function Footer() {
  const site = await getSiteConfig();
  const links = site.navigation
    .filter((item) => item.active && item.location === 'FOOTER')
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const groups = [...new Set(links.map((item) => item.group || 'Links'))];
  return (
    <footer className="mt-20 border-t bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[2fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-3 font-black">
            {site.theme.logoUrl && <Image src={site.theme.logoUrl} alt="" width={32} height={32} />}
            {site.theme.brandName}
          </div>
          <p className="mt-3 max-w-sm text-sm text-slate-600">{site.theme.footerText}</p>
        </div>
        {groups.map((group) => (
          <div key={group}>
            <h3 className="font-bold">{group}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {links.filter((item) => (item.group || 'Links') === group).map((item) => (
                <li key={item.id}><Link href={item.href} className="hover:text-[var(--accent)]">{item.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
