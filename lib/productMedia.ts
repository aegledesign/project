import type { Product } from './types';

export function getDefaultMockup(product: Product, colorKey?: string) {
  const active = product.mockups
    .filter((mockup) => mockup.active && (!colorKey || mockup.colorKey === colorKey))
    .sort((left, right) => left.displayOrder - right.displayOrder);
  return active.find((mockup) => mockup.isDefault) ?? active[0] ?? null;
}

export function getPrintLocations(product: Product) {
  return [...new Set(
    product.mockups
      .filter((mockup) => mockup.active)
      .flatMap((mockup) => mockup.printAreas.filter((area) => area.active).map((area) => area.label)),
  )];
}
