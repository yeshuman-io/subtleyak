export default {
  server: {
    host: true,
    strictPort: true,
    port: 7001,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ['@medusajs/medusa/dist/core/loaders/plugins']
  }
} 