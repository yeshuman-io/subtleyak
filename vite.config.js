import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'yeshuman-server.up.railway.app',
      'localhost',
      '127.0.0.1'
    ]
  }
}) 