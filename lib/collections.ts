import { readJson } from './dataStore';
import type { ProductCollection } from './types';

export function getCollections() {
  return readJson<ProductCollection[]>('collections.json', []);
}

export async function getPublishedCollections() {
  return (await getCollections())
    .filter((collection) => collection.active && collection.published)
    .sort((left, right) => left.displayOrder - right.displayOrder);
}
