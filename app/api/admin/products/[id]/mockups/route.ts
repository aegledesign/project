import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { productMockupSchema } from '@/lib/schemas';
import type { Product } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const product = (await readJson<Product[]>('products.json', [])).find((item) => item.id === id);
  return product
    ? NextResponse.json([...product.mockups].sort((a, b) => a.displayOrder - b.displayOrder))
    : NextResponse.json({ error: 'Product not found' }, { status: 404 });
}

export async function POST(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const body = await request.json();
  const mockupId = body.id || crypto.randomUUID();
  const areas = Array.isArray(body.printAreas)
    ? body.printAreas.map((area: Record<string, unknown>) => ({
        ...area,
        id: area.id || crypto.randomUUID(),
        mockupId,
      }))
    : [];
  const parsed = productMockupSchema.safeParse({ ...body, id: mockupId, productId: id, printAreas: areas });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid mockup', issues: parsed.error.flatten() }, { status: 400 });
  }
  const products = await readJson<Product[]>('products.json', []);
  const product = products.find((item) => item.id === id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  if (parsed.data.isDefault) product.mockups.forEach((mockup) => { mockup.isDefault = false; });
  product.mockups.push(parsed.data);
  await writeJson('products.json', products);
  return NextResponse.json(parsed.data, { status: 201 });
}

export async function PATCH(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const { orderedIds } = await request.json() as { orderedIds?: string[] };
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: 'orderedIds is required' }, { status: 400 });
  }
  const products = await readJson<Product[]>('products.json', []);
  const product = products.find((item) => item.id === id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  product.mockups.forEach((mockup) => {
    const index = orderedIds.indexOf(mockup.id);
    if (index >= 0) mockup.displayOrder = index;
  });
  await writeJson('products.json', products);
  return NextResponse.json(product.mockups);
}
