import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { productMockupSchema } from '@/lib/schemas';
import type { Product } from '@/lib/types';

type Context = { params: Promise<{ id: string; mockupId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id, mockupId } = await params;
  const body = await request.json();
  const parsed = productMockupSchema.safeParse({
    ...body,
    id: mockupId,
    productId: id,
    printAreas: (body.printAreas ?? []).map((area: Record<string, unknown>) => ({
      ...area,
      id: area.id || crypto.randomUUID(),
      mockupId,
    })),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid mockup', issues: parsed.error.flatten() }, { status: 400 });
  }
  const products = await readJson<Product[]>('products.json', []);
  const product = products.find((item) => item.id === id);
  const index = product?.mockups.findIndex((mockup) => mockup.id === mockupId) ?? -1;
  if (!product || index < 0) return NextResponse.json({ error: 'Mockup not found' }, { status: 404 });
  if (parsed.data.isDefault) product.mockups.forEach((mockup) => { mockup.isDefault = false; });
  product.mockups[index] = parsed.data;
  await writeJson('products.json', products);
  return NextResponse.json(parsed.data);
}

export async function DELETE(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id, mockupId } = await params;
  const products = await readJson<Product[]>('products.json', []);
  const product = products.find((item) => item.id === id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  product.mockups = product.mockups.filter((mockup) => mockup.id !== mockupId);
  await writeJson('products.json', products);
  return NextResponse.json({ ok: true });
}
