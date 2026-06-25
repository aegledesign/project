import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/dataStore';
import type { SiteContent } from '@/lib/types';
export async function GET(){ return NextResponse.json(await readJson<SiteContent>('content.json', {heroTitle:'',heroSubtitle:'',announcement:'',phone:'',email:''})); }
export async function POST(req:Request){ const body=await req.json(); await writeJson('content.json', body); return NextResponse.json(body); }
