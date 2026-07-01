import { z } from 'zod';

const normalized = z.number().finite().min(0).max(1);

export const printAreaSchema = z.object({
  id: z.string().min(1),
  mockupId: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  x: normalized,
  y: normalized,
  width: normalized.refine((value) => value > 0, 'Width must be greater than zero'),
  height: normalized.refine((value) => value > 0, 'Height must be greater than zero'),
  rotation: z.number().finite().min(-360).max(360),
  bleed: z.number().finite().min(0).max(0.25),
  active: z.boolean(),
}).superRefine((area, context) => {
  if (area.x + area.width > 1.0001) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['width'], message: 'Area exceeds image width' });
  }
  if (area.y + area.height > 1.0001) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['height'], message: 'Area exceeds image height' });
  }
});

export const productMockupSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  mediaAssetId: z.string().optional(),
  imageUrl: z.string().url(),
  altText: z.string().trim().min(1).max(180),
  view: z.enum(['FRONT', 'BACK', 'LEFT', 'RIGHT', 'DETAIL']),
  colorKey: z.string().trim().min(1).max(50),
  displayOrder: z.number().int().min(0),
  active: z.boolean(),
  isDefault: z.boolean(),
  printAreas: z.array(printAreaSchema).max(20),
});

export const productVariantSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  colorKey: z.string().trim().min(1).max(50),
  colorName: z.string().trim().min(1).max(80),
  hexColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sku: z.string().max(80).optional(),
  active: z.boolean(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().min(1).optional(),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(2000),
  variants: z.array(productVariantSchema).min(1),
  mockups: z.array(productMockupSchema),
  sizes: z.array(z.string().trim().min(1)).min(1),
  basePrice: z.number().finite().nonnegative(),
  priceBreaks: z.array(z.object({
    min: z.number().int().positive(),
    unitPrice: z.number().finite().nonnegative(),
  })).min(1),
  sku: z.string().trim().min(1).max(80),
  active: z.boolean(),
  tags: z.array(z.string().trim().min(1)).max(20),
});

export const productCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0),
  active: z.boolean(),
});

const navigationSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().startsWith('/'),
  location: z.enum(['HEADER', 'FOOTER']),
  group: z.string().max(80),
  displayOrder: z.number().int().min(0),
  active: z.boolean(),
});

const linkPath = z.string().trim().startsWith('/');
const heroSectionSchema = z.object({
  type: z.literal('HERO'),
  headline: z.string().trim().min(1).max(180),
  subheading: z.string().trim().min(1).max(500),
  imageUrl: z.string().url(),
  imageAlt: z.string().trim().min(1).max(180),
  primaryLabel: z.string().trim().min(1).max(80),
  primaryHref: linkPath,
});
const categoryGridSchema = z.object({
  type: z.literal('CATEGORY_GRID'),
  heading: z.string().trim().min(1).max(120),
  categories: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    imageUrl: z.string().url(),
    href: linkPath,
  })).max(12),
});
const promoSchema = z.object({
  type: z.literal('PROMO_BANNER'),
  headline: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(500),
  href: linkPath,
  linkLabel: z.string().trim().min(1).max(80),
});
const featuredSchema = z.object({
  type: z.literal('FEATURED_PRODUCTS'),
  heading: z.string().trim().min(1).max(120),
  productIds: z.array(z.string().min(1)).max(24),
});
const testimonialsSchema = z.object({
  type: z.literal('TESTIMONIALS'),
  heading: z.string().trim().min(1).max(120),
  items: z.array(z.object({
    quote: z.string().trim().min(1).max(800),
    name: z.string().trim().min(1).max(100),
    organization: z.string().trim().min(1).max(120),
  })).max(20),
});
const faqSchema = z.object({
  type: z.literal('FAQ'),
  heading: z.string().trim().min(1).max(120),
  items: z.array(z.object({
    question: z.string().trim().min(1).max(240),
    answer: z.string().trim().min(1).max(1200),
  })).max(40),
});
const sectionContentSchema = z.discriminatedUnion('type', [
  heroSectionSchema,
  categoryGridSchema,
  promoSchema,
  featuredSchema,
  testimonialsSchema,
  faqSchema,
]);

export const siteConfigSchema = z.object({
  pages: z.array(z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    active: z.boolean(),
    sections: z.array(z.object({
      id: z.string().min(1),
      type: z.enum(['HERO', 'CATEGORY_GRID', 'PROMO_BANNER', 'FEATURED_PRODUCTS', 'TESTIMONIALS', 'FAQ']),
      displayOrder: z.number().int().min(0),
      active: z.boolean(),
      content: sectionContentSchema,
    }).superRefine((section, context) => {
      if (section.type !== section.content.type) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['content', 'type'], message: 'Content type must match section type' });
      }
    })),
  })),
  navigation: z.array(navigationSchema),
  theme: z.object({
    brandName: z.string().trim().min(1).max(80),
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    footerText: z.string().max(500),
  }),
});
