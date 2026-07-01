import { readJson } from './dataStore';
import type { ProductCollection } from './types';

export function getCollections() {
  return readJson<ProductCollection[]>('collections.json', []);
}
