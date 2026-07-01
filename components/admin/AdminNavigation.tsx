'use client';

import Link from 'next/link';
import { Boxes, ClipboardList, FileText, LayoutDashboard, Package } from 'lucide-react';
import { usePathname } from 'next/navigation';

const links = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Collections', href: '/admin/collections', icon: Boxes },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { label: 'Content', href: '/admin/content', icon: FileText },
];

export function AdminNavigation() {
  const pathname = usePathname();
  if (pathname === '/admin/login') return null;

  return (
    <nav className="border-b border-slate-300 bg-slate-950 text-white" aria-label="Backend navigation">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
        {links.map(({ label, href, icon: Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-14 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold ${
                active
                  ? 'border-teal-400 bg-white/10 text-white'
                  : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
