import { defineConfig } from 'astro/config';

// Public address of the Academy. Used for canonical URLs, hreflang
// alternates and the sitemap. Change it here when the domain is decided.
export const SITE = 'https://academy.de9de9.dz';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
});
