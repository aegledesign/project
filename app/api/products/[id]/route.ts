import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/dataStore';
import type { Product } from '@/lib/types';
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){ const {id}=await params; const products=await readJson<Product[]>('products.json', []); await writeJson('products.json', products.filter(p=>p.id!==id)); return NextResponse.json({ok:true}); }
