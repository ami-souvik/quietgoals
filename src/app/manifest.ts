import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quiet Goals',
    short_name: 'Quiet Goals',
    description: 'A single-list, keyboard-first, unapologetically minimal goals app.',
    start_url: '/',
    display: 'standalone',
    background_color: '#161518',
    theme_color: '#161518',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
