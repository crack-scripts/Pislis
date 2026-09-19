import type { Metadata, Viewport } from 'next';
import './globals.css';

// Self-hosted fonts (Inter + Playfair Display) — no external font CDN needed
import localFont from 'next/font/local';

const inter = localFont({
  src: [
    { path: './fonts/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const playfairDisplay = localFont({
  src: [
    { path: './fonts/playfair-display-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/playfair-display-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/playfair-display-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/playfair-display-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-display',
  preload: true,
});

// Comprehensive metadata for SEO
export const metadata: Metadata = {
  title: {
    default: 'Darwin - Facebook Automation & Page Growth Mastery',
    template: '%s | Darwin Education',
  },
  description: 'Master Facebook automation and grow your page organically. Learn proven strategies to monetize your FB page without spending on ads.',
  keywords: ['Facebook automation', 'page growth', 'social media marketing', 'organic growth', 'monetization'],
  authors: [{ name: 'Darwin Education' }],
  creator: 'Darwin Education',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://darwin.education'),
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Darwin Education',
    title: 'Darwin - Facebook Automation & Page Growth Mastery',
    description: 'Master Facebook automation and grow your page organically.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Darwin - Facebook Automation Mastery',
    description: 'Master Facebook automation and grow your page organically.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10B981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

