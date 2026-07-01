import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dataDirectory = path.join(process.cwd(), 'data');
await mkdir(dataDirectory, { recursive: true });

const imageUrls = {
  tee: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85',
  polo: 'https://images.unsplash.com/photo-1625910513413-5fc45e982d8d?auto=format&fit=crop&w=1200&q=85',
  tote: 'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?auto=format&fit=crop&w=1200&q=85',
  cap: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=85',
  hero: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1800&q=85',
};

function printArea(mockupId, suffix, label, x, y, width, height) {
  return {
    id: `${mockupId}-${suffix}`,
    mockupId,
    label,
    x,
    y,
    width,
    height,
    rotation: 0,
    bleed: 0.02,
    active: true,
  };
}

function mockup(productId, imageKey, view, colorKey, order, areas, isDefault = false) {
  const id = `${productId}-${colorKey.toLowerCase()}-${view.toLowerCase()}`;
  return {
    id,
    productId,
    mediaAssetId: `media-${imageKey}`,
    imageUrl: imageUrls[imageKey],
    altText: `${colorKey} ${view.toLowerCase()} product mockup`,
    view,
    colorKey,
    displayOrder: order,
    active: true,
    isDefault,
    printAreas: areas(id),
  };
}

function variants(productId, values) {
  return values.map(([colorKey, colorName, hexColor], index) => ({
    id: `${productId}-variant-${index + 1}`,
    productId,
    colorKey,
    colorName,
    hexColor,
    active: true,
  }));
}

const products = [
  {
    id: 'p1',
    slug: 'classic-tee',
    name: 'Classic Cotton Tee',
    category: 'T-Shirts',
    description: 'Soft everyday cotton tee for events, schools, teams, and business campaigns.',
    variants: variants('p1', [['WHITE', 'White', '#ffffff'], ['BLACK', 'Black', '#111827']]),
    mockups: [
      mockup('p1', 'tee', 'FRONT', 'WHITE', 0, (id) => [
        printArea(id, 'full-front', 'Full Front', 0.34, 0.25, 0.32, 0.42),
        printArea(id, 'chest', 'Front Chest', 0.37, 0.24, 0.16, 0.16),
      ], true),
      mockup('p1', 'tee', 'BACK', 'WHITE', 1, (id) => [
        printArea(id, 'back', 'Back', 0.34, 0.24, 0.32, 0.43),
      ]),
      mockup('p1', 'tee', 'FRONT', 'BLACK', 2, (id) => [
        printArea(id, 'full-front', 'Full Front', 0.34, 0.25, 0.32, 0.42),
      ]),
    ],
    sizes: ['YS', 'YM', 'YL', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    basePrice: 18,
    priceBreaks: [{ min: 12, unitPrice: 18 }, { min: 24, unitPrice: 15 }, { min: 48, unitPrice: 12.5 }],
    sku: 'AEG-TEE-001',
    active: true,
    tags: ['Best Seller', 'Screen Print'],
  },
  {
    id: 'p2',
    slug: 'performance-polo',
    name: 'Performance Polo',
    category: 'Polos',
    description: 'Moisture-wicking polo for uniforms, golf outings, and staff apparel.',
    variants: variants('p2', [['NAVY', 'Navy', '#172554'], ['WHITE', 'White', '#ffffff']]),
    mockups: [
      mockup('p2', 'polo', 'FRONT', 'NAVY', 0, (id) => [
        printArea(id, 'left-chest', 'Front Chest', 0.34, 0.27, 0.14, 0.16),
        printArea(id, 'right-chest', 'Pocket', 0.52, 0.27, 0.14, 0.16),
      ], true),
      mockup('p2', 'polo', 'BACK', 'NAVY', 1, (id) => [
        printArea(id, 'back', 'Back', 0.34, 0.24, 0.32, 0.4),
      ]),
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    basePrice: 34,
    priceBreaks: [{ min: 6, unitPrice: 34 }, { min: 12, unitPrice: 30 }, { min: 24, unitPrice: 27 }],
    sku: 'AEG-POLO-010',
    active: true,
    tags: ['Embroidery', 'Uniform'],
  },
  {
    id: 'p3',
    slug: 'canvas-tote',
    name: 'Heavy Canvas Tote',
    category: 'Bags',
    description: 'Durable canvas tote for retail, trade shows, gifts, and corporate giveaways.',
    variants: variants('p3', [['NATURAL', 'Natural', '#e7d7bd'], ['BLACK', 'Black', '#111827']]),
    mockups: [
      mockup('p3', 'tote', 'FRONT', 'NATURAL', 0, (id) => [
        printArea(id, 'front', 'Full Front', 0.3, 0.37, 0.4, 0.36),
      ], true),
      mockup('p3', 'tote', 'BACK', 'NATURAL', 1, (id) => [
        printArea(id, 'back', 'Back', 0.3, 0.37, 0.4, 0.36),
      ]),
    ],
    sizes: ['One Size'],
    basePrice: 16,
    priceBreaks: [{ min: 25, unitPrice: 16 }, { min: 50, unitPrice: 13.5 }, { min: 100, unitPrice: 11.25 }],
    sku: 'AEG-BAG-020',
    active: true,
    tags: ['Promo', 'Retail'],
  },
  {
    id: 'p4',
    slug: 'embroidered-cap',
    name: 'Embroidered Cap',
    category: 'Hats',
    description: 'Structured cap with an embroidery-ready front panel and adjustable closure.',
    variants: variants('p4', [['BLACK', 'Black', '#111827'], ['KHAKI', 'Khaki', '#c3ae86']]),
    mockups: [
      mockup('p4', 'cap', 'FRONT', 'BLACK', 0, (id) => [
        printArea(id, 'front', 'Front Chest', 0.34, 0.38, 0.32, 0.2),
      ], true),
      mockup('p4', 'cap', 'LEFT', 'BLACK', 1, (id) => [
        printArea(id, 'left', 'Left Sleeve', 0.3, 0.4, 0.22, 0.16),
      ]),
      mockup('p4', 'cap', 'RIGHT', 'BLACK', 2, (id) => [
        printArea(id, 'right', 'Right Sleeve', 0.48, 0.4, 0.22, 0.16),
      ]),
    ],
    sizes: ['Adjustable'],
    basePrice: 22,
    priceBreaks: [{ min: 12, unitPrice: 22 }, { min: 24, unitPrice: 19 }, { min: 48, unitPrice: 17 }],
    sku: 'AEG-HAT-030',
    active: true,
    tags: ['Embroidery'],
  },
];

const media = Object.entries(imageUrls).map(([key, url]) => ({
  id: `media-${key}`,
  url,
  key: `seed/${key}.jpg`,
  fileName: `${key}.jpg`,
  mimeType: 'image/jpeg',
  size: 0,
  altText: `${key} product photography`,
  createdAt: new Date().toISOString(),
}));

const site = {
  pages: [{
    id: 'page-home',
    slug: 'home',
    title: 'Home',
    active: true,
    sections: [
      {
        id: 'home-hero',
        type: 'HERO',
        displayOrder: 0,
        active: true,
        content: {
          type: 'HERO',
          headline: 'Custom apparel and branded goods, built for your team.',
          subheading: 'Choose a product, place your artwork, approve the proof, and track production.',
          imageUrl: imageUrls.hero,
          imageAlt: 'Rack of customizable apparel',
          primaryLabel: 'Browse products',
          primaryHref: '/catalog',
        },
      },
      {
        id: 'home-categories',
        type: 'CATEGORY_GRID',
        displayOrder: 1,
        active: true,
        content: {
          type: 'CATEGORY_GRID',
          heading: 'Shop by category',
          categories: [
            { name: 'T-Shirts', imageUrl: imageUrls.tee, href: '/catalog' },
            { name: 'Bags', imageUrl: imageUrls.tote, href: '/catalog' },
            { name: 'Hats', imageUrl: imageUrls.cap, href: '/catalog' },
          ],
        },
      },
      {
        id: 'home-featured',
        type: 'FEATURED_PRODUCTS',
        displayOrder: 2,
        active: true,
        content: { type: 'FEATURED_PRODUCTS', heading: 'Popular products', productIds: ['p1', 'p2', 'p3', 'p4'] },
      },
      {
        id: 'home-promo',
        type: 'PROMO_BANNER',
        displayOrder: 3,
        active: true,
        content: {
          type: 'PROMO_BANNER',
          headline: 'Free digital proof with every order',
          body: 'Review placement, scale, and color before production begins.',
          href: '/artwork-help',
          linkLabel: 'Artwork services',
        },
      },
      {
        id: 'home-testimonials',
        type: 'TESTIMONIALS',
        displayOrder: 4,
        active: true,
        content: {
          type: 'TESTIMONIALS',
          heading: 'Trusted by teams',
          items: [
            { quote: 'The online proof made our event order straightforward.', name: 'Morgan Lee', organization: 'Northside Athletics' },
            { quote: 'Every department received the right sizes on schedule.', name: 'Chris James', organization: 'Summit Health' },
          ],
        },
      },
      {
        id: 'home-faq',
        type: 'FAQ',
        displayOrder: 5,
        active: true,
        content: {
          type: 'FAQ',
          heading: 'Common questions',
          items: [
            { question: 'Can I upload my own logo?', answer: 'Yes. Upload PNG, JPG, WebP, or SVG artwork in the design studio.' },
            { question: 'Will I see a proof?', answer: 'Yes. Production starts only after your proof is approved.' },
          ],
        },
      },
    ],
  }],
  navigation: [
    { id: 'nav-catalog', label: 'Catalog', href: '/catalog', location: 'HEADER', group: '', displayOrder: 0, active: true },
    { id: 'nav-groups', label: 'Group Orders', href: '/group-orders', location: 'HEADER', group: '', displayOrder: 1, active: true },
    { id: 'nav-artwork', label: 'Artwork Help', href: '/artwork-help', location: 'HEADER', group: '', displayOrder: 2, active: true },
    { id: 'footer-products', label: 'Products', href: '/catalog', location: 'FOOTER', group: 'Shop', displayOrder: 0, active: true },
    { id: 'footer-quote', label: 'Request a quote', href: '/checkout', location: 'FOOTER', group: 'Services', displayOrder: 1, active: true },
    { id: 'footer-groups', label: 'Group ordering', href: '/group-orders', location: 'FOOTER', group: 'Services', displayOrder: 2, active: true },
  ],
  theme: {
    brandName: 'Aegle Custom',
    primaryColor: '#111827',
    accentColor: '#0f766e',
    backgroundColor: '#fffaf5',
    footerText: 'Custom apparel and promotional products with online proofs and production tracking.',
  },
};

await Promise.all([
  writeFile(path.join(dataDirectory, 'products.json'), JSON.stringify(products, null, 2)),
  writeFile(path.join(dataDirectory, 'collections.json'), JSON.stringify([], null, 2)),
  writeFile(path.join(dataDirectory, 'media.json'), JSON.stringify(media, null, 2)),
  writeFile(path.join(dataDirectory, 'site.json'), JSON.stringify(site, null, 2)),
]);

console.log(`Seeded ${products.length} products, ${media.length} media assets, and ${site.pages.length} page.`);
