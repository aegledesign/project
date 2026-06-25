import Link from 'next/link';
import { ShoppingBag, Settings } from 'lucide-react';
export function Header(){
 const nav=[['Catalog','/catalog'],['Group Orders','/group-orders'],['Artwork Help','/artwork-help'],['Quote','/checkout']];
 return <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><Link href="/" className="text-xl font-black tracking-tight">Aegle<span className="text-ocean">Custom</span></Link><nav className="hidden gap-6 text-sm font-semibold md:flex">{nav.map(([n,h])=><Link key={h} href={h} className="hover:text-ocean">{n}</Link>)}</nav><div className="flex gap-2"><Link href="/cart" className="btn-secondary !px-4"><ShoppingBag size={18}/></Link><Link href="/admin" className="btn-primary !px-4"><Settings size={18}/></Link></div></div></header>
}
