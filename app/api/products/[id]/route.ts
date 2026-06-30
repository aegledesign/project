import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { productSchema } from '@/lib/schemas';
import type { Product } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const products = await readJson<Product[]>('products.json', []);
  const product = products.find((item) => item.id === id);
  return product
    ? NextResponse.json(product)
    : NextResponse.json({ error: 'Product not found' }, { status: 404 });
}

export async function PUT(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const parsed = productSchema.safeParse({ ...await request.json(), id });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product', issues: parsed.error.flatten() }, { status: 400 });
  }
  const products = await readJson<Product[]>('products.json', []);
  await writeJson('products.json', [...products.filter((item) => item.id !== id), parsed.data]);
  return NextResponse.json(parsed.data);
}

export async function DELETE(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const products = await readJson<Product[]>('products.json', []);
  await writeJson('products.json', products.filter((product) => product.id !== id));
  return NextResponse.json({ ok: true });
}
