export type PriceBreak = { min: number; unitPrice: number };
export type MockupView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'DETAIL';

export type MediaAsset = {
  id: string;
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
  altText: string;
  createdAt: string;
};

export type PrintArea = {
  id: string;
  mockupId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  bleed: number;
  active: boolean;
};

export type ProductMockup = {
  id: string;
  productId: string;
  mediaAssetId?: string;
  imageUrl: string;
  altText: string;
  view: MockupView;
  colorKey: string;
  displayOrder: number;
  active: boolean;
  isDefault: boolean;
  printAreas: PrintArea[];
};

export type ProductVariant = {
  id: string;
  productId: string;
  colorKey: string;
  colorName: string;
  hexColor?: string;
  sku?: string;
  active: boolean;
};

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId?: string;
  category: string;
  description: string;
  variants: ProductVariant[];
  mockups: ProductMockup[];
  sizes: string[];
  basePrice: number;
  priceBreaks: PriceBreak[];
  sku: string;
  active: boolean;
  tags: string[];
};

export type CartItem = {
  id: string;
  productSlug: string;
  productName: string;
  color: string;
  printLocation: string;
  sizes: Record<string, number>;
  unitPrice: number;
  designJson?: string;
  preview?: string;
  mockupId?: string;
  printAreaId?: string;
};

export type Order = {
  id: string;
  customerName: string;
  email: string;
  status: string;
  total: number;
  items: CartItem[];
  createdAt: string;
  notes?: string;
  proofStatus?: string;
};

export type HeroSection = {
  type: 'HERO';
  headline: string;
  subheading: string;
  imageUrl: string;
  imageAlt: string;
  primaryLabel: string;
  primaryHref: string;
};

export type CategoryGridSection = {
  type: 'CATEGORY_GRID';
  heading: string;
  categories: Array<{ name: string; imageUrl: string; href: string }>;
};

export type PromoSection = {
  type: 'PROMO_BANNER';
  headline: string;
  body: string;
  href: string;
  linkLabel: string;
};

export type FeaturedProductsSection = {
  type: 'FEATURED_PRODUCTS';
  heading: string;
  productIds: string[];
};

export type TestimonialsSection = {
  type: 'TESTIMONIALS';
  heading: string;
  items: Array<{ quote: string; name: string; organization: string }>;
};

export type FaqSection = {
  type: 'FAQ';
  heading: string;
  items: Array<{ question: string; answer: string }>;
};

export type PageSectionContent =
  | HeroSection
  | CategoryGridSection
  | PromoSection
  | FeaturedProductsSection
  | TestimonialsSection
  | FaqSection;

export type PageSection = {
  id: string;
  type: PageSectionContent['type'];
  displayOrder: number;
  active: boolean;
  content: PageSectionContent;
};

export type Page = {
  id: string;
  slug: string;
  title: string;
  active: boolean;
  sections: PageSection[];
};

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  location: 'HEADER' | 'FOOTER';
  group: string;
  displayOrder: number;
  active: boolean;
};

export type ThemeSetting = {
  brandName: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  footerText: string;
};

export type SiteConfig = {
  pages: Page[];
  navigation: NavigationItem[];
  theme: ThemeSetting;
};

export type SiteContent = {
  heroTitle: string;
  heroSubtitle: string;
  announcement: string;
  phone: string;
  email: string;
};
