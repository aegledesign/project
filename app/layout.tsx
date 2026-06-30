import './globals.css';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSiteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Aegle Custom | Custom Apparel & Promo Products',
  description: 'Custom apparel and promotional product design and ordering.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = await getSiteConfig();
  const style = {
    '--primary': theme.primaryColor,
    '--accent': theme.accentColor,
    '--site-background': theme.backgroundColor,
  } as CSSProperties;
  return (
    <html lang="en" style={style}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
