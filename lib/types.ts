export type PriceBreak = { min: number; unitPrice: number };
export type Product = {
  id: string; slug: string; name: string; category: string; description: string;
  hero: string; colors: string[]; sizes: string[]; printLocations: string[];
  basePrice: number; priceBreaks: PriceBreak[]; sku: string; active: boolean; tags: string[];
};
export type CartItem = { id: string; productSlug: string; productName: string; color: string; printLocation: string; sizes: Record<string, number>; unitPrice: number; designJson?: string; preview?: string; };
export type Order = { id: string; customerName: string; email: string; status: string; total: number; items: CartItem[]; createdAt: string; notes?: string; proofStatus?: string; };
export type SiteContent = { heroTitle: string; heroSubtitle: string; announcement: string; phone: string; email: string; };
