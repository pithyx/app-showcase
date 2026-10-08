import pithyx from '@pithyx/cli/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `npm run dev` serves the app in the mock desktop of `pithyx dev`; `npm run build` writes dist/ and validates it.
export default defineConfig({
  plugins: [react(), pithyx()],
});
