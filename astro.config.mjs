// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site: https://mleggiero.github.io/wedding-site/
export default defineConfig({
  site: 'https://mleggiero.github.io',
  base: '/wedding-site',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
