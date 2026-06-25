import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products';
import { DesignStudio } from '@/components/DesignStudio';
export default async function DesignPage({params}:{params:Promise<{slug:string}>}){ const {slug}=await params; const product=await getProductBySlug(slug); if(!product) return notFound(); return <main className="mx-auto max-w-7xl px-6 py-10"><h1 className="text-4xl font-black">Design studio: {product.name}</h1><p className="mt-2 text-slate-600">Add text, upload artwork, place elements, save proof data, and add the designed item to cart.</p><DesignStudio product={product}/></main> }
