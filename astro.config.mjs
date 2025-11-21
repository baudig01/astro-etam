// @ts-check
// @ts-ignore
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import node from '@astrojs/node';
import path from 'path';


// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [preact()],
  vite: {
    server: {
      watch: {
        usePolling: true, // Force le polling pour détecter les changements
      },
      hmr: {
        overlay: true, // Affiche les erreurs
      },
    },
    resolve: {
      alias: {
        '@': path.resolve('./src')
      },
      dedupe: ['preact', '@preact/signals', '@preact/signals-core']
    },
  }
});
