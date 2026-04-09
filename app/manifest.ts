import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CYBERPOL Denuncias',
    short_name: 'Cyberpol',
    description: 'Sistema de Gestión de Denuncias - Policía Nacional',
    start_url: '/inicio',
    display: 'standalone',
    background_color: '#002147',
    theme_color: '#002147',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
