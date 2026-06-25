import type { Product } from './types';
import { readJson } from './dataStore';
export { getUnitPrice, totalQty } from './pricing';

export async function getProducts(): Promise<Product[]> { return readJson<Product[]>('products.json', []); }
export async function getActiveProducts() { return (await getProducts()).filter(p => p.active); }
export async function getProductBySlug(slug: string) { return (await getProducts()).find(p => p.slug === slug); }
