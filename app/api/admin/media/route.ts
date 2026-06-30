import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { readJson, writeJson } from '@/lib/dataStore';
import { storeMedia } from '@/lib/storage';
import type { MediaAsset } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await readJson<MediaAsset[]>('media.json', []));
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const data = await request.formData();
    const file = data.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A media file is required' }, { status: 400 });
    }
    const stored = await storeMedia(file);
    const asset: MediaAsset = {
      id: crypto.randomUUID(),
      ...stored,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      altText: String(data.get('altText') ?? ''),
      createdAt: new Date().toISOString(),
    };
    const assets = await readJson<MediaAsset[]>('media.json', []);
    await writeJson('media.json', [...assets, asset]);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    );
  }
}
