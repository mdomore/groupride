import { defineConfig } from 'vite'

export default defineConfig({
  base: '/groupride/',
  server: {
    host: '0.0.0.0',  // Listen on all interfaces for external access
    port: 3000,
    open: false,  // Don't auto-open browser on server
    https: false,  // Disable HTTPS for now (clipboard will use fallback)
    allowedHosts: ['mdomore.ddns.net', '192.168.1.200', 'localhost']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
