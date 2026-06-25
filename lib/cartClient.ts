'use client';
import { create } from 'zustand';
import type { CartItem } from './types';

type CartState = { items: CartItem[]; add: (item: CartItem)=>void; remove:(id:string)=>void; clear:()=>void; total:()=>number; };
export const useCart = create<CartState>((set,get)=>({
  items: [],
  add: (item) => set({ items: [...get().items.filter(i=>i.id!==item.id), item] }),
  remove: (id) => set({ items: get().items.filter(i=>i.id!==id) }),
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, item) => sum + Object.values(item.sizes).reduce((a,b)=>a+b,0) * item.unitPrice, 0)
}));
