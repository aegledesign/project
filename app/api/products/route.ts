import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/dataStore';
import type { Product } from '@/lib/types';
export async function GET(){ return NextResponse.json(await readJson<Product[]>('products.json', [])); }
export async function POST(req:Request){ const product=await req.json() as Product; const products=await readJson<Product[]>('products.json', []); const next=[...products.filter(p=>p.id!==product.id), product]; await writeJson('products.json', next); return NextResponse.json(product); }
