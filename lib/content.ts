import type { SiteContent } from './types';
import { readJson } from './dataStore';
export async function getContent(): Promise<SiteContent> {
  return readJson<SiteContent>('content.json', { heroTitle:'Custom products made easy', heroSubtitle:'Design and order online.', announcement:'Free proof', phone:'', email:'' });
}
