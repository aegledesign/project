import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { productCategorySchema } from '@/lib/schemas';
import type { Product, ProductCategory } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const parsed = productCategorySchema.safeParse({ ...await request.json(), id });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid category', issues: parsed.error.flatten() }, { status: 400 });
  }
  const [categories, products] = await Promise.all([
    readJson<ProductCategory[]>('categories.json', []),
    readJson<Product[]>('products.json', []),
  ]);
  if (!categories.some((category) => category.id === id)) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
  if (categories.some((category) => category.id !== id && category.slug === parsed.data.slug)) {
    return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
  }
  products.forEach((product) => {
    if (product.categoryId === id) product.category = parsed.data.name;
  });
  await Promise.all([
    writeJson('categories.json', categories.map((category) => category.id === id ? parsed.data : category)),
    writeJson('products.json', products),
  ]);
  return NextResponse.json(parsed.data);
}

export async function DELETE(request: Request, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const [categories, products] = await Promise.all([
    readJson<ProductCategory[]>('categories.json', []),
    readJson<Product[]>('products.json', []),
  ]);
  if (products.some((product) => product.categoryId === id)) {
    return NextResponse.json({ error: 'Move products to another category before deleting this category' }, { status: 409 });
  }
  await writeJson('categories.json', categories.filter((category) => category.id !== id));
  return NextResponse.json({ ok: true });
}
