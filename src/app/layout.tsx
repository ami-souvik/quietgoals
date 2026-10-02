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
    icon: '/icon.png',
    apple: '/icon.png',
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} ${hostGrotesk.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var t = localStorage.getItem('quiet_goals_theme');
                if (!t) {
                  t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                }
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch(e) {}
            })()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
