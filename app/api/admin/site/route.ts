import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { writeJson } from '@/lib/dataStore';
import { siteConfigSchema } from '@/lib/schemas';
import { getSiteConfig } from '@/lib/site';

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await getSiteConfig());
}

export async function PUT(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const parsed = siteConfigSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid site configuration', issues: parsed.error.flatten() }, { status: 400 });
  }
  await writeJson('site.json', parsed.data);
  return NextResponse.json(parsed.data);
}
