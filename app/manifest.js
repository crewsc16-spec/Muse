export default function manifest() {
  return {
    name: 'Muse',
    short_name: 'Muse',
    description: 'Your personal mood journal and vision board',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fdf8f3',
    theme_color: '#b88a92',
    icons: [
      {
        src: '/icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
