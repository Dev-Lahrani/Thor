import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Same-origin proxies for feeds that send no CORS headers. Used by the dev
// server and `vite preview`, so no third-party relay sees these requests.
// Production static hosts fall back to the public relay (see services/api.ts).
const feedProxy = {
  '/feeds/kev': {
    target: 'https://www.cisa.gov',
    changeOrigin: true,
    rewrite: () => '/sites/default/files/feeds/known_exploited_vulnerabilities.json',
  },
  '/feeds/feodo': {
    target: 'https://feodotracker.abuse.ch',
    changeOrigin: true,
    rewrite: () => '/downloads/ipblocklist.json',
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: feedProxy },
  preview: { proxy: feedProxy },
})
