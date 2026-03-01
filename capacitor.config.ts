import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.yourmuse.muse',
  appName: 'Muse',
  webDir: 'out',
  server: {
    url: 'https://yourmuse.app',
    cleartext: false,
  },
};

export default config;
