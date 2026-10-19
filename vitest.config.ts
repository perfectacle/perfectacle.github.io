/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Astro's Vite config resolves `astro:content` and other virtual modules for the tested helpers.
export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
