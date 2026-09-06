// @ts-check
// Astro build config for the fiducia.cloud marketing site: static output served
// by the Rust backend, under the gateway `/fiducia` base path.
import { defineConfig } from 'astro/config';
import { oresWasmLoader } from './integrations/ores-wasm-loader.mjs';

export default defineConfig({
  site: 'https://fiducia.cloud',
  base: process.env.PUBLIC_BASE ?? '/fiducia',
  output: 'static',
  integrations: [
    oresWasmLoader({
      appId: 'fiducia-cloud',
      triggerSelector: 'a[href="#start"]',
    }),
  ],
});
