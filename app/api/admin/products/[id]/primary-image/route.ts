import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { storeMedia } from '@/lib/storage';
import type { MediaAsset, Product, ProductMockup } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const products = await readJson<Product[]>('products.json', []);
  const product = products.find((item) => item.id === id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A product image is required' }, { status: 400 });
    }
    const stored = await storeMedia(file);
    const altText = String(form.get('altText') || `${product.name} product image`);
    const asset: MediaAsset = {
      id: crypto.randomUUID(),
      ...stored,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      altText,
      createdAt: new Date().toISOString(),
    };

    const assets = await readJson<MediaAsset[]>('media.json', []);
    let mockup = product.mockups.find((item) => item.isDefault)
      ?? [...product.mockups].sort((left, right) => left.displayOrder - right.displayOrder)[0];

    if (mockup) {
      mockup.mediaAssetId = asset.id;
      mockup.imageUrl = asset.url;
      mockup.altText = altText;
      mockup.isDefault = true;
    } else {
      const mockupId = crypto.randomUUID();
      const colorKey = product.variants.find((variant) => variant.active)?.colorKey ?? product.variants[0]?.colorKey;
      if (!colorKey) {
        return NextResponse.json({ error: 'Add a product color before uploading a mockup' }, { status: 400 });
      }
      mockup = {
        id: mockupId,
        productId: product.id,
        mediaAssetId: asset.id,
        imageUrl: asset.url,
        altText,
        view: 'FRONT',
        colorKey,
        displayOrder: 0,
        active: true,
        isDefault: true,
        printAreas: [{
          id: crypto.randomUUID(),
          mockupId,
          label: 'Full Front',
          x: 0.3,
          y: 0.25,
          width: 0.4,
          height: 0.45,
          rotation: 0,
          bleed: 0.02,
          active: true,
        }],
      } satisfies ProductMockup;
      product.mockups.push(mockup);
    }

    product.mockups.forEach((item) => {
      if (item.id !== mockup.id) item.isDefault = false;
    });
    await Promise.all([
      writeJson('media.json', [...assets, asset]),
      writeJson('products.json', products),
    ]);
    return NextResponse.json({ asset, mockup, product });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to replace product image' },
      { status: 400 },
    );
  }
}
