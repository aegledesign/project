import { readJson } from './dataStore';
import type { ProductCategory } from './types';

export function getCategories() {
  return readJson<ProductCategory[]>('categories.json', []);
}

export async function getActiveCategories() {
  return (await getCategories())
    .filter((category) => category.active)
    .sort((left, right) => left.displayOrder - right.displayOrder);
}
