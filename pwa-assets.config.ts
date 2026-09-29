import {defineConfig, minimal2023Preset as preset} from '@vite-pwa/assets-generator/config';

// The icon art already sits inside the maskable safe zone on a full-bleed background, so no extra padding.
export default defineConfig({
  preset: {
    ...preset,
    maskable: {...preset.maskable, padding: 0, resizeOptions: {background: '#121212'}},
    apple: {...preset.apple, padding: 0, resizeOptions: {background: '#121212'}},
  },
  images: ['public/app-icon.svg'],
});
