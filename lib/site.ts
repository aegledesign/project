import type { SiteConfig } from './types';
import { readJson } from './dataStore';

export const defaultSiteConfig: SiteConfig = {
  pages: [],
  navigation: [],
  theme: {
    brandName: 'Aegle Custom',
    primaryColor: '#111827',
    accentColor: '#0f766e',
    backgroundColor: '#fffaf5',
    footerText: '',
  },
};

export function getSiteConfig() {
  return readJson<SiteConfig>('site.json', defaultSiteConfig);
}
