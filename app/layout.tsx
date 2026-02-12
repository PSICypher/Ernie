import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { InstallBanner } from '@/components/pwa/InstallBanner';

export const metadata: Metadata = {
  title: 'Holiday Planner',
  description: 'Plan your family holidays with AI assistance',
  themeColor: '#8B5CF6',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Holiday Planner'
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <InstallBanner />
      </body>
    </html>
  );
}
