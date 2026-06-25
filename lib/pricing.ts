import type { Product } from './types';

export function getUnitPrice(product: Product, qty: number) {
  const sorted = [...product.priceBreaks].sort((a, b) => b.min - a.min);
  return sorted.find((b) => qty >= b.min)?.unitPrice ?? product.basePrice;
}

export function totalQty(sizes: Record<string, number>) {
  return Object.values(sizes).reduce((a, b) => a + (Number(b) || 0), 0);
}
