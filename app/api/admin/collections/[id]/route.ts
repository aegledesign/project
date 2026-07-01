import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { productCollectionSchema } from '@/lib/schemas';
import type { Product, ProductCollection } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const [collections, products] = await Promise.all([
    readJson<ProductCollection[]>('collections.json', []),
    readJson<Product[]>('products.json', []),
  ]);
  const existing = collections.find((collection) => collection.id === id);
  if (!existing) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  const body = await request.json();
  const parsed = productCollectionSchema.safeParse({
    ...body,
    id,
    productIds: [...new Set(body.productIds ?? [])],
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid collection', issues: parsed.error.flatten() }, { status: 400 });
  }
  if (collections.some((collection) => collection.id !== id && collection.slug === parsed.data.slug)) {
    return NextResponse.json({ error: 'Collection slug already exists' }, { status: 409 });
  }
  const productIds = new Set(products.map((product) => product.id));
  if (parsed.data.productIds.some((productId) => !productIds.has(productId))) {
    return NextResponse.json({ error: 'Collection includes an unknown product' }, { status: 400 });
  }
  await writeJson('collections.json', collections.map((collection) => collection.id === id ? parsed.data : collection));
  return NextResponse.json(parsed.data);
}

export async function DELETE(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const collections = await readJson<ProductCollection[]>('collections.json', []);
  if (!collections.some((collection) => collection.id === id)) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }
  await writeJson('collections.json', collections.filter((collection) => collection.id !== id));
  return NextResponse.json({ ok: true });
}
