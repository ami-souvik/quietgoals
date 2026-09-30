import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Geist_Mono } from 'next/font/google';
import './globals.css';

const hostGrotesk = localFont({
  variable: '--font-host-grotesk',
  src: [
    {
      path: './fonts/HostGrotesk-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/HostGrotesk-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/HostGrotesk-Bold.ttf',
      weight: '800',
      style: 'normal',
    },
  ],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#161518',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'quiet goals',
  description: 'A single-list, keyboard-first, unapologetically minimal goals app.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quiet Goals',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} ${hostGrotesk.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
