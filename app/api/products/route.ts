import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { productSchema } from '@/lib/schemas';
import type { Product } from '@/lib/types';

export async function GET() {
  return NextResponse.json(await readJson<Product[]>('products.json', []));
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product', issues: parsed.error.flatten() }, { status: 400 });
  }
  const products = await readJson<Product[]>('products.json', []);
  const next = [...products.filter((product) => product.id !== parsed.data.id), parsed.data];
  await writeJson('products.json', next);
  return NextResponse.json(parsed.data);
}
