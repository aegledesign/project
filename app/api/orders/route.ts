import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/dataStore';
import type { Order } from '@/lib/types';
export async function GET(){ return NextResponse.json(await readJson<Order[]>('orders.json', [])); }
export async function POST(req:Request){ const body=await req.json(); const orders=await readJson<Order[]>('orders.json', []); const order:Order={id:'ORD-'+Date.now(), customerName:body.customerName, email:body.email, notes:body.notes, items:body.items??[], total:Number(body.total??0), status:'Quote Requested', proofStatus:'Pending', createdAt:new Date().toISOString()}; await writeJson('orders.json', [order,...orders]); return NextResponse.json(order); }
export async function PATCH(req:Request){ const body=await req.json(); const orders=await readJson<Order[]>('orders.json', []); const next=orders.map(o=>o.id===body.id?{...o,...body}:o); await writeJson('orders.json', next); return NextResponse.json({ok:true}); }
