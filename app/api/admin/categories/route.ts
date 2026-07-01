import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { productCategorySchema } from '@/lib/schemas';
import type { ProductCategory } from '@/lib/types';

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const categories = await readJson<ProductCategory[]>('categories.json', []);
  return NextResponse.json(categories.sort((left, right) => left.displayOrder - right.displayOrder));
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const parsed = productCategorySchema.safeParse({
    ...body,
    id: body.id || crypto.randomUUID(),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid category', issues: parsed.error.flatten() }, { status: 400 });
  }
  const categories = await readJson<ProductCategory[]>('categories.json', []);
  if (categories.some((category) => category.slug === parsed.data.slug)) {
    return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
  }
  await writeJson('categories.json', [...categories, parsed.data]);
  return NextResponse.json(parsed.data, { status: 201 });
}
