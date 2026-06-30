import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { deleteMedia } from '@/lib/storage';
import type { MediaAsset, Product } from '@/lib/types';

export const runtime = 'nodejs';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const [assets, products] = await Promise.all([
    readJson<MediaAsset[]>('media.json', []),
    readJson<Product[]>('products.json', []),
  ]);
  const asset = assets.find((item) => item.id === id);
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  if (products.some((product) => product.mockups.some((mockup) => mockup.mediaAssetId === id))) {
    return NextResponse.json({ error: 'Asset is assigned to a product mockup' }, { status: 409 });
  }
  await deleteMedia(asset.key);
  await writeJson('media.json', assets.filter((item) => item.id !== id));
  return NextResponse.json({ ok: true });
}
