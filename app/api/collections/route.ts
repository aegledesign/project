import { NextResponse } from 'next/server';
import { getPublishedCollections } from '@/lib/collections';

export async function GET() {
  return NextResponse.json(await getPublishedCollections());
}
