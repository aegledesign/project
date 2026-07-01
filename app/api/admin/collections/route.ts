import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { productCollectionSchema } from '@/lib/schemas';
import type { Product, ProductCollection } from '@/lib/types';

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const collections = await readJson<ProductCollection[]>('collections.json', []);
  return NextResponse.json(collections.sort((left, right) => left.displayOrder - right.displayOrder));
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const now = new Date().toISOString();
  const parsed = productCollectionSchema.safeParse({
    ...body,
    id: body.id || crypto.randomUUID(),
    productIds: [...new Set(body.productIds ?? [])],
    published: Boolean(body.published),
    publishedAt: body.published ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid collection', issues: parsed.error.flatten() }, { status: 400 });
  }
  const [collections, products] = await Promise.all([
    readJson<ProductCollection[]>('collections.json', []),
    readJson<Product[]>('products.json', []),
  ]);
  if (collections.some((collection) => collection.slug === parsed.data.slug)) {
    return NextResponse.json({ error: 'Collection slug already exists' }, { status: 409 });
  }
  const productIds = new Set(products.map((product) => product.id));
  if (parsed.data.productIds.some((id) => !productIds.has(id))) {
    return NextResponse.json({ error: 'Collection includes an unknown product' }, { status: 400 });
  }
  await writeJson('collections.json', [...collections, parsed.data]);
  return NextResponse.json(parsed.data, { status: 201 });
}
